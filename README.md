# This Day in History

This is my ongoing history/coding project on displaying different events throughout the globe that occurred on each day. Note that some of the dates may be off
by a few days since this website is hosted on github pages, so it has to be manually updated. Besides that, this globe is fully interactible and can be a way 
of being introduced to historical events that occurred on "this" certain day. 

# WikiMedia API

This website is based off of fetching data from the WikiMedia API (https://api.wikimedia.org/), which gives back a list of wikipedia entries for respective dates. 

![image](https://user-images.githubusercontent.com/97778590/182578486-02060d57-7dec-4403-95a0-5389b1e45d6f.png)

The fetched data was spliced and stored as JSON files for future use in JS files. 

# Three.JS

Overall, the 3D globe and markers were made with Three.JS, a cross-browser JavaScript library and application programming interface used to 
create and display animated 3D computer graphics in a web browser using WebGL. The markers are interactible with the user by clicking on the red 
markers that are present throughout the globe. 

![image](https://user-images.githubusercontent.com/97778590/182580082-b9a46474-9dca-4093-9e9d-60f7f8e9e99c.png)

Each marker represents an event that occurred at that exact coordinate on that date, and clicking on these 
markers creates a text box that describes the event and the year it happened. Coordinates and Wikipedia links are also included at the bottom of the text box.

# Future Ideas

Firstly, cleaning up the fetched API event data is a big issue. There is currently no algorithm that selects the historical events based on historical significance, 
so the events that are shown on the globe are quite random at this point. Other parameters that have to be considered make this task especially difficult, so 
it definitely is an important problem to resolve in the future. 

Another (perhaps minor) issue is that when the markers are clicked, ALL of the markers turn yellow instead of just the one that is being clicked. This is a 
limitation to how the code is structured and how the marker object is created, but there may be a solution out there that I can't find at this moment. 

Including images of the event on the text boxes may also be another idea, but I'm not sure if it will worsen the performance of the website (especially on mobile) 
significantly. Testing on different hardwares is definitely on the next list of tasks.

On a final note: special shoutout to prisoner849 of the Three.js community for creating this globe! This project that I had in mind for a long time was made MUCH easier 
thanks to his work. The math behind animating the globe and markers would have been much more difficult without his work. <3



