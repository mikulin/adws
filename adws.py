# -*- coding: utf-8 -*-
from flask import Flask, request, render_template, Markup
import codecs
import json
import uuid

app = Flask(__name__)


@app.route('/')
def wordlist():
    word_list = open('wordlist.csv', 'r', encoding='utf-8')
    table = ''
    for line in word_list:
        word_id = line.split(';')[0]
        word = line.split(';')[1]
        author = line.split(';')[2]
        status = line.split(';')[3]
        table = table + '<tr><td><a href="/edit?word_id=' + word_id + '">' + word + '</a></td><td>' + author + '</td><td>' + status + '</td></tr>'
    return render_template('index.html', content=Markup(table))


@app.route('/new', methods=['GET'])
def newword():
    return render_template('word_create.html')


@app.route('/edit', methods=['GET'])
def editword():
    word_to_edit = request.args.get('word_id')
    wordtext = open('static/words/' + word_to_edit + '.json', 'r', encoding='utf-8')
    wordlist = open('wordlist.csv', 'r', encoding='utf-8')
    for line in wordlist:
        word_id = line.split(';')[0]
        if word_id == word_to_edit:
            word = line.split(';')[1]
            author = line.split(';')[2]
            status = line.split(';')[3]
            break
    data = wordtext.read()
    json_data = json.loads(data)
    lexemes = ''
    for item in json_data['lex']:
        lexemes = lexemes + '<tr><td>' + item['lex_title'] + '</td><td><a href="edit_lex?lex_id=' + item['word_id'] +'&word_id=' + word_to_edit + '">редактировать</a></td></tr>'
    return render_template('word_update.html', contents=Markup('\'' + data.replace('\\', '\\\\') + '\''), word=word, author = author, status=status, word_id=word_to_edit, lexemes=Markup(lexemes))


@app.route('/new_lex', methods=['GET'])
def newlex():
    word_to_edit = request.args.get('word_id')
    word = request.args.get('word')
    return render_template('lex_create.html', word_id=word_to_edit, word=word)


@app.route('/edit_lex', methods=['GET'])
def editlex():
    lex_to_edit = request.args.get('lex_id')
    word_to_edit = request.args.get('word_id')
    wordtext = open('static/words/' + word_to_edit + '.json', 'r', encoding='utf-8')
    data = wordtext.read()
    json_data = json.loads(data)
    word = json_data['word']
    for item in json_data['lex']:
        if item['word_id'] == lex_to_edit:
            number = item['num']
            data = str(item)
    return render_template('lex_update.html', contents=Markup(data.replace('\'', '\"').replace('True','\"True\"')), word=word, number=number, lex_id=lex_to_edit, word_to_edit=word_to_edit)


@app.route('/update', methods=['POST'])
def getUpdatedData():
    data = request.get_data()
    data = data.decode('utf-8')
    json_data = json.loads(data)
    word = str(json_data['word'])
    author = str(json_data['author'])
    status = str(json_data['status'])
    word_to_edit = str(json_data['word_id'])
    temp = []
    wordlist_file = open('wordlist.csv', 'r', encoding='utf-8')
    for line in wordlist_file:
        if line.split(';')[0] == word_to_edit:
            temp.append(word_to_edit + ';' + word + ';' + author + ';' + status + '\n')
        else:
            temp.append(line)
    wordlist_file.close()
    wordlist_file = open('wordlist.csv', 'w', encoding='utf-8')
    for item in temp:
        wordlist_file.write(item)
    wordlist_file.close()
    wordfile = open('static/words/' + word_to_edit + '.json', 'r', encoding='utf-8')
    new_json_data = json.loads(wordfile.read())
    wordfile.close()
    new_json_data['word'] = word
    new_json_data['author'] = author
    new_json_data['status'] = status
    new_json_data['voc'] = json_data['voc']
    new_json_data['phr'] = json_data['phr']
    wordfile = open('static/words/' + word_to_edit + '.json', 'w', encoding='utf-8')
    wordfile.write(str(new_json_data).replace('\'', '\"').replace('True','true').replace(u' ', u' '))
    wordfile.close()
    return 'OK'


@app.route('/update_lex', methods=['POST'])
def getUpdatedLexData():
    data = request.get_data()
    data = data.decode('utf-8')
    print(data)
    json_data = json.loads(data)
    lex_id = json_data['word_id']
    word_to_edit = json_data['word_to_edit']
    print(json_data['word_to_edit'])
    print(word_to_edit)
    wordfile = open('static/words/' + word_to_edit + '.json', 'r', encoding='utf-8')
    new_json_data = json.loads(wordfile.read())
    wordfile.close()
    for item in new_json_data['lex']:
        if item['word_id'] == lex_id:
            item['word_id'] = json_data['word_id']
            item['num'] = json_data['num']
            item['lex_title'] = json_data['lex_title']
            item['lex'] = json_data['lex']
            item['exa'] = json_data['exa']
            item['def'] = json_data['def']
            item['com'] = json_data['com']
            item['gov'] = json_data['gov']
            item['col'] = json_data['col']
            item['con'] = json_data['con']
            item['ill'] = json_data['ill']
            item['sem'] = json_data['sem']
    wordfile = open('static/words/' + word_to_edit + '.json', 'w', encoding='utf-8')
    wordfile.write(str(new_json_data).replace('\'', '\"').replace('True','true'))
    wordfile.close()
    return 'OK'


@app.route('/create', methods=['POST', 'GET'])
def getNewData():
    data = request.get_data()
    data = data.decode('utf-8')
    json_data = json.loads(data)
    word = json_data['word']
    author = json_data['author']
    status = json_data['status']
    word_id = str(uuid.uuid4())
    wordlist = open('wordlist.csv', 'a', encoding='utf-8')
    wordlist.write(word_id + ';' + word + ';' + author + ';' + status + '\n')
    wordlist.close()
    wordfile = open('static/words/' + word_id + '.json', 'w', encoding='utf-8')
    wordfile.write(data)
    wordfile.close()
    return 'OK'


@app.route('/create_lex', methods=['POST', 'GET'])
def getNewLexData():
    data = request.get_data()
    data = data.decode('utf-8')
    json_data = json.loads(data)
    word_id = json_data['word_id']
    wordfile = open('static/words/' + word_id + '.json', 'r', encoding='utf-8')
    old_data = json.loads(wordfile.read())
    wordfile.close()
    json_data['word_id'] = json_data['word_id'] + json_data['num']
    old_data['lex'].append(json_data)
    wordfile = open('static/words/' + word_id + '.json', 'w', encoding='utf-8')
    wordfile.write(str(old_data).replace('\'', '\"').replace('True','true'))
    return 'OK'


if __name__ == '__main__':
    app.run(debug=True)
