import datetime
import requests
from time import *
import json

today = datetime.datetime.now()
date = today.strftime('%m/%d')
# date = '03/18'
month = date[:2]
month_dict = {'01':'January', '02':'February', '03':'March', '04':'April', '05':'May', '06':'June', '07':'July', '08':'August', '09':'September',
			'10':'October', '11':'November', '12':'December'}
month_key = month_dict[month]

url = 'https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/' + date

response = requests.get(url)
datas = response.json()


#steps:
	#from a "selected' curated list of events that happend today,
		#look into the 'pages' portion of the event
			#in the text extract of the wiki page, if the current month is explicitly mentioned:
				#print the coordinates, page content, and the year of the event 

# for key in datas['selected']:
# 	for page in key['pages']:
# 		if month_key in page['extract']:
# 			try: 
# 				print(page['coordinates'])
# 				print(page['title'].replace('_', ' '))
# 				print(key['year'])
# 				print(page['extract'].replace("/", ''))
# 			except KeyError:
# 				continue

text_dict = {}
coord_dict = {} 
year_dict = {}
urls = {}
titles = {}

#same thing as the block on top but look at "events" instead of "pages"
i = 0 
for key in datas['events']:
	for page in key['pages']:
		if month_key in page['extract']:
			try: 
				# finding the coord has to come first because if the wiki doenst have coordinates we skip it automatically
				coord_dict[str(i)] = str(page['coordinates']['lat']) + ', ' + str(page['coordinates']['lon'])	
				year = str(key['year']).replace('-', 'BC ')
				year_dict[str(i)] = year
				text_dict[str(i)] = page['extract'].replace("/", '').replace("–", "-")
				titles[str(i)] = page['titles']['normalized']
				urls[str(i)] = page["content_urls"]['desktop']['page']
				i += 1
			except KeyError:
				continue
	

json_object = json.dumps(text_dict, indent=4)
with open("text.json", "w") as outfile:
    outfile.write(json_object)

json_object = json.dumps(coord_dict, indent=4)
with open("coord.json", "w") as outfile:
    outfile.write(json_object)

json_object = json.dumps(year_dict, indent=4)
with open("year.json", "w") as outfile:
    outfile.write(json_object)

json_object = json.dumps(titles, indent=4)
with open("titles.json", "w") as outfile:
    outfile.write(json_object)

json_object = json.dumps(urls, indent=4)
with open("urls.json", "w") as outfile:
    outfile.write(json_object)