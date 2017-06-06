/*!
 * jQuery tablefilter Plugin - v1.0.2
 * Copyright (c) 2015 Lenon Mauer
 * Version: 1.0.2 (23-JUL-2015)
 * Under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 * Requires: jQuery v1.7.2 or later
 */
 
(function($) {

	var methods = {
	
		init : function(settings) {
		
			return this.each(function() {
			
				var configs = {

					// input que vãi filtrar as tabelas
					'input' : 'input[type=search]',

					'trigger': {
						
						"event" 	: "keyup", // Evento que vai chamar o a função de filtro nas tabelas
						'element' 	: undefined // Elemento que será aplicado o evento, undefined será o próprio input do filtro
					},

					'caseSensitive'	:  false,
					
					'timeout'	: -1, // Timeout for keyboard events (keyup, keypress ...)
					
					'sort'	: false, // Aplica a função de ordenação das linhas

					'notFoundElement' : null,

					'callback'	:	function(){}
				};
				
				if(typeof(settings) === "object")
					$.extend(true, configs, settings);
				
				var $table = $(this);
				var $timeout = null;

				if(!configs.trigger.element)
					configs.trigger.element = configs.input;
					
				if(!configs.trigger.element.length)
					$.error('Trigger element not found.');

				configs.notFoundElement = $(configs.notFoundElement);

				/* Filtro das tabelas */
				$(configs.trigger.element).bind(configs.trigger.event, function() {

					if(configs.trigger.event.indexOf("key") < 0)
						configs.timeout = 0;

					try {
						
						clearTimeout($timeout);

					} catch(err){}
		
					$timeout = setTimeout(function(){

						filterTable.call(undefined, $table, configs);
						
					}, configs.timeout);
				});

				// Configuração para o sort das tabelas
				if(configs.sort) {

					var ths = $table.find("th:not([data-tsort=disabled])");
					
					ths.append("<span class=\"caret\"></span>").attr("data-tsort", "desc");

					ths.css("cursor", "pointer").addClass("tfsort").bind("click", function() {
						
						sort.call(undefined, this)
					});
				}
			});
		}
	}
	
	var filterTable = function(table, configs) {

		var textFound;
		var tdText;
		var values = $(configs.input).val() || $(configs.input).text();
		var toHide = [];
		var toShow = [];

		values = values.trim().split(" ");
		values = values.map(function(v){return v.trim();});

		if(!configs.caseSensitive)
			values = values.map(function(val){return val.toLowerCase();});

		values.map(function(val, index) {
			
			if(!val.trim().length)
				values.splice(index, 1);
		});

		if(!values.length) {
			
			toShow = table.find('tbody tr:hidden').toArray();

		} else {

			var disableds = [];

			table.find('thead th').each(function(index) {

				if($(this).attr("data-tfilter") == "disabled")
					disableds.push(index);
			});

			var trs = table.find('tbody tr').toArray();

			for(var i in trs) {

				if(i == "length")
					continue;

				var tr = trs[i];

				var textFound = 0;
				var arrayText = []; // TD texts

				$(tr).find('td:not([data-tfilter=disabled])').each(function(ind) {

					for(var i2 in disableds)
						if(disableds[i2] == ind)
							return;

					var tdText = $(this).text().trim();

					if(tdText.length)
						arrayText.push(!configs.caseSensitive ? tdText.toLowerCase() : tdText);
				});

				values.forEach(function(v){

					arrayText.every(function(t){

						if(t.indexOf(v) >= 0) {
							
							textFound++;
							return false;
						}
				
						return true;
					});
				});

				textFound = textFound == values.length;

				if(!textFound && $(tr).is(":visible"))
					toHide.push(tr);
				else if(textFound && $(tr).is(":hidden"))
					toShow.push(tr);
			}
		}

		if(toShow.length) {

			if(table.is(":hidden"))
				toShow.push(table.get(0));

			fastShow(toShow, "show");
		}

		if(toHide.length)
			fastShow(toHide, "hide");

		if(!toShow.length && !toHide.length)
			return;

		configs.callback.call();
		notFoundMessage(table, configs.notFoundElement);
	}
	
	var sort = function(th) {
		
		th = $(th);

		var tds 	= th.closest("table").find("tbody td:nth-child("+(th.parent().find("th").index(th.get(0))+1)+")");
		var array 	= [];

		/* Altera o sentido da ordenação */
		th.filter("[data-tsort=asc]").length ? th.attr("data-tsort", "desc") : th.attr("data-tsort", "asc");

		/* Altera o sentido da ordenação do ícone */
		th.attr("data-tsort") == "asc" ? $(th).find("span.caret").css("transform", "rotate(180deg)") : $(th).find("span.caret").css("transform", "rotate(0deg)");
		
		/* Copia as linhas para serem ordenadas */
		tds.each(function(a) {

			array[array.length] = {
				
				text: null,
				obj : $(this).closest("tr")
			};

			var text;
			
			switch(th.attr("data-tsort-type")){
				
				case "number" : text = parseFloat($(this).text().replace(/[,]/g, ".").replace(/[^0-9\.\-]/g, ""));break;
				case "date" : try{text = new Date($(this).text()).getTime();}catch(err){text = 0};break;
				
				case "date-br" : 
				
					if($(this).text().match(/[0-9\/]+[\s]+[0-9]+[:]/g)) //Datetime
						text = ($(this).text().split(" ")[0].split("/").reverse().join("-"))+" "+($(this).text().split(" ")[1]);
					else if($(this).text().match(/[0-9]{2}[\/]{1}[0-9]{2}[\/]{1}[0-9]{4}/g))
						text = $(this).text().split("/").reverse().join("-");
					else
						text = 0;

					text = new Date(text).getTime();
					break;
				
				default : text = $(this).text().toLowerCase();
			};
			
			array[array.length-1]["text"] = text;
		});
		
		/* Ordena as linhas */
		for(var i=0; i< array.length; i++) {

			for(var i2=0; i2< array.length; i2++) {
		
				if((array[i].text < array[i2].text && th.attr("data-tsort") == "asc") || (array[i].text > array[i2].text && th.attr("data-tsort") == "desc")) {
				
					temp 		= array[i];
					array[i] 	= array[i2];
					array[i2] 	= temp;
				}
			}
		}
		
		/* Adiciona as linhas novamente na tabela */
		for(i=0; i< array.length; i++)
			$(th).closest("table").find("tbody").append(array[i].obj);
	}

	var notFoundMessage = function(table, notfound) {

		if(!notfound.length)
			return;

		if(!table.find("tbody tr:visible").length) {
			fastShow(notfound, "show");
			fastShow(table, "hide");
		} else		
			fastShow(notfound, "hide");
	};

	var fastShow = function(array, type) {

		var leng = array.length;

		for(var i=0; i<leng;i++)
			array[i].style.display = type == "show" ? "" : "none";
	}

	$.fn.tableFilter = function(method) {

		if (methods[method])
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		else if(typeof method === 'object' || !method)
			return methods.init.apply(this, arguments);
		else
			$.error( 'the method ' +  method + ' does not exist on tableFilter' );
	};
})(jQuery);