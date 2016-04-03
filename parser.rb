require 'json'
line_num=-1
text=File.open('sample_input_data/5x5/matrix.txt').read
text.gsub!(/\r\n?/, "\n")
arr = []
text[1..-1].each_line do |line|
  ret = line.scan(/\d+\s[0-9]*\.?[0-9]+/)
  ret.each do |node|
    node = node.split(' ')
    tmp_hsh = {
      source: line_num,
      target: (node[0].to_i - 1).to_s,
      value: node[1].to_f
    }
    # p tmp_hsh
    arr << tmp_hsh
  end
  puts arr.to_json
  print "#{line_num} #{line}"
  line_num += 1
end
