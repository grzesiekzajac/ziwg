# Load the dictionary back from the pickle file.
import pickle
import json
import re

names_out = []
names = pickle.load(open("sample_input_data/100x100/rowlabels.pkl", "rb"))
for name in names:
    tmp_hsh = {
        'name': name,
        'group': str(3)
    }
    names_out.append(tmp_hsh)

array = []
line_num=0
with open("sample_input_data/100x100/matrix.txt") as f:
    content = f.readlines()

regex = r"\d+\s[0-9]*\.?[0-9]+"
for line in content[1:]:
    arr = re.findall(regex, line)
    for node in arr:
        node = node.split()
        tmp_hsh = {
            'source': str(line_num),
            'target': str((int(node[0]) - 1)),
            'value': str(float(node[1]))
        }
        array.append(tmp_hsh)
    line_num += 1

out = {'nodes': names_out, 'links': array}
json_hsh = json.dumps(out)

with open('result.txt', 'w') as outfile:
    outfile.write(json_hsh)
