
this.width = 800;
this.height = 450;
this.thumbScale = 5;

//Class for each slide of the storyboard
function Slide(stage) {
    
    //The full size image
    this.img=stage.createImageData(width, height);
    
    //How much of it has been completed
    this.roughAnimated=false;
    this.finalAnimated=false;
    this.colored=false;
    this.background=false;
    this.sound=false;

    //How long it's shown for
    this.duration=1;
}


//Class for managing undos/redos
function History(max) {
    this.history = [];
    this.historyPosition = -1;
    var maxHistory = max || 30;

    this.reset = function () {
        history = [];
        historyPosition = -1;
    };

    //Creates a new restore point in history for undo/redo
    this.createHistory = function(imgData) {
        
        //changed=true;
        
        //Make sure the current drawing isn't identical to the previous one
        //if (historyPosition==-1 || !compareImages(stage.getImageData(0, 0, width, height), history[historyPosition])) {
            
            //If there is history ahead of the current position, erase it
            if (this.historyPosition<this.history.length-1) {
                var l=this.history.length;
                for (var i=0; i<(l-1-this.historyPosition); i++) {
                    this.history.pop();
                }
                this.historyPosition=this.history.length-1;
            }
            
            //Add the current image to the history
            this.history.push(imgData);
            //history.push(stage.getImageData(0, 0, width, height));
            
            //If there's more history than allowed, erase one from the beginning.
            if (this.history.length>=maxHistory) {
                this.history.shift();
            } else {
                this.historyPosition++;
            }
        //}
    };
}

//Class for managing the slide list as well as the canvas
function Timeline() {
    this.slides = [];
    this.currentSlide = 0;
    this.changed=false;

    var history = new History(30);

    //Reference to the HTML element
    var canvas=document.getElementById("stage");
    var stage;

    var mousePos;
    var tool = 0;
    var size=4;
    var eraserSize=8;

    var tl=this;

    this.playbackTimer;
    this.playbackSlide = 0;
    var theatreCanvas = document.getElementById("theatre");
    var theatre;


    //Updates the slide's completion variables when checkboxes are clicked
    this.updateProgress = function () {
        tl.slides[tl.currentSlide].roughAnimated=document.getElementById("rough").checked;
        tl.slides[tl.currentSlide].finalAnimated=document.getElementById("final").checked;
        tl.slides[tl.currentSlide].colored=document.getElementById("colored").checked;
        tl.slides[tl.currentSlide].background=document.getElementById("background").checked;
        tl.slides[tl.currentSlide].sound=document.getElementById("sound").checked;
        tl.slides[tl.currentSlide].duration=parseFloat(document.getElementById("duration").value)||1;
        document.getElementById("duration").value = parseFloat(document.getElementById("duration").value)||1;
    };

    this.reset = function() {
        document.getElementById("timeline").innerHTML="";
        
        document.getElementById("rough").checked=false;
        document.getElementById("colored").checked=false;
        document.getElementById("final").checked=false;
        document.getElementById("background").checked=false;
        document.getElementById("sound").checked=false;

        this.slides = [];

        history.reset();

        changed=false;
        
        this.loadSlide(-1);
    };

    this.clear = function() {
        document.getElementById("timeline").innerHTML="";
        
        document.getElementById("rough").checked=false;
        document.getElementById("colored").checked=false;
        document.getElementById("final").checked=false;
        document.getElementById("background").checked=false;
        document.getElementById("sound").checked=false;

        this.slides = [];

        history.reset();

        changed=false;
    };

    this.getDataURI = function() {
        return canvas.toDataURL("image/png");
    };

    //Updates the thumbnail for the current slide
    var updateThumb = function() {
        if (this.slides.length==0) return false;
        //Update the slide variable's store of the image
        this.slides[this.currentSlide].img=stage.getImageData(0, 0, width, height);
        
        //Write a blank image onto the thumbnail
        var blank = stage.createImageData(width/thumbScale, height/thumbScale);
        document.getElementById("canvas"+this.currentSlide).getContext("2d").putImageData(blank, 0, 0);
        
        //Scale the content of the canvas and put it onto the thumbnail
        document.getElementById("canvas"+this.currentSlide).getContext("2d").drawImage(canvas, 0, 0, width/thumbScale, height/thumbScale);
    }.bind(this);

    //Switches the images on two thumbnails
    var switchThumbs = function(position, position2) {
        
        //Get the two thumbnail images
        var img1 = document.getElementById("canvas"+position).getContext("2d").getImageData(0, 0, width/thumbScale, height/thumbScale);
        var img2 = document.getElementById("canvas"+position2).getContext("2d").getImageData(0, 0, width/thumbScale, height/thumbScale);
        
        //If both exist, switch them.
        if (img1 && img2) {
            document.getElementById("canvas"+position).getContext("2d").putImageData(img2, 0, 0);
            document.getElementById("canvas"+position2).getContext("2d").putImageData(img1, 0, 0);
        }
    }.bind(this);

    //Load a slide up for editing
    this.loadSlide = function(n) {

        if (n == undefined) {
            n=this.currentSlide;
        }

        if (typeof(n) == "string") {
            n = Number(n);
        }

        //If this is being used to initialize the first slide
        if (n==-1) {
            
            //Create a new slide and reset the history
            this.slides=[];
            this.currentSlide=0;
            this.clearStage(true);
            history.reset();
            history.createHistory(stage.getImageData(0, 0, width, height));
            updateThumb();

            this.addSlide();
            
        //Otherwise, load the specified slide
        } else {
            
            //Deselect the previously selected slide
            if (document.getElementById("slide" + this.currentSlide)) document.getElementById("slide" + this.currentSlide).classList.remove('selected');
            
            //Select the new slide
            this.currentSlide=n;
            document.getElementById("slide" + this.currentSlide).classList.add('selected');
            
            //Reset the history
            history.reset();
            stage.putImageData(this.slides[this.currentSlide].img, 0, 0);
            history.createHistory(stage.getImageData(0, 0, width, height));
            updateThumb();
            
            //Change the progress checkboxes so they match the loaded slide's
            document.getElementById("rough").checked=this.slides[this.currentSlide].roughAnimated;
            document.getElementById("final").checked=this.slides[this.currentSlide].finalAnimated;
            document.getElementById("colored").checked=this.slides[this.currentSlide].colored;
            document.getElementById("background").checked=this.slides[this.currentSlide].background;
            document.getElementById("sound").checked=this.slides[this.currentSlide].sound;
            document.getElementById("duration").value=this.slides[this.currentSlide].duration;
        }
    };

    //Add a new slide
    this.addSlide = function() {

        //Create a new slide variable and add it to the array
        var s = new Slide(stage);
        this.slides.push(s);

        //Remove the "+" button so we can add other things in that spot
        var add = document.getElementById("add");
        if (add) {
            add.parentNode.removeChild(add);
        }
        
        //Create a new thumbnail for the new slide
        var sdiv = document.createElement("div");
        sdiv.id = "slide" + (this.slides.length-1);
        sdiv.className = "slide";
        
        //Give the new thumbnail a canvas and arrow buttons to move it left and right
        sdiv.innerHTML = "<canvas id=\"canvas" + (this.slides.length-1) + "\" width=\"" + (width/thumbScale) + "\" height=\"" + (height/thumbScale) + "\"></canvas><p>" + (this.slides.length-1) + "</p>";
        
        sdiv.innerHTML += "<a class=\"lsf-icon larr\" title=\"Move Up\" id=\"arrowup\"></a>";
        sdiv.innerHTML += "<a class=\"lsf-icon close\" title=\"Remove Slide\" id=\"close\"></a>";
        sdiv.innerHTML += "<a class=\"lsf-icon rarr\" title=\"Move Down\" id=\"arrowdown\"></a>";
        sdiv.innerHTML += "<a class=\"lsf-icon copy\" title=\"Duplicate Slide\" id=\"copy\"></a>";
        
        var num = this.slides.length-1;
        
        sdiv.getElementsByTagName("a")[0].onclick=function() {tl.moveLeft(event, ""+num);};
        sdiv.getElementsByTagName("a")[1].onclick=function() {tl.removeSlide(event, ""+num);};
        sdiv.getElementsByTagName("a")[2].onclick=function() {tl.moveRight(event, ""+num);};
        sdiv.getElementsByTagName("a")[3].onclick=function() {tl.duplicateSlide(event, ""+num);};
        
        //When the thumbnail is clicked, load its corresponding slide
        sdiv.onclick = function () {
            tl.loadSlide(""+num);
        }
        
        //Add the new thumbnail to the timeline
        document.getElementById("timeline").appendChild(sdiv);
        
        //Create a new "+" button
        var add = document.createElement("a");
        add.id = "add";
        add.style.width = (width/thumbScale) + "px";
        add.style.height = (height/thumbScale) + "px";
        add.style.lineHeight = (height/thumbScale) + "px";
        add.title = "Add New Slide";
        //add.href="#";
        add.innerHTML="+";
        
        //When it's clicked, add a new slide
        add.onclick = function () {
            tl.addSlide();
        }
            
        //add it to the timeline
        document.getElementById("timeline").appendChild(add);
        
        //Load this new slide that we just added
        this.loadSlide(this.slides.length-1);
    };

    //Add a new slide
    this.duplicateSlide = function(evt, position) {

        //Make sure the slide under the arrow doesn't trigger an event
        event.stopPropagation();

        //Get a number for the position
        if (typeof(position)=="string") {
            position=parseInt(position);
        }

        //Create a new slide variable and add it to the array
        var s = new Slide(stage);
        s.img = tl.slides[position].img;
        tl.slides.push(s);

        //Remove the "+" button so we can add other things in that spot
        var add = document.getElementById("add");
        if (add) {
            add.parentNode.removeChild(add);
        }
        
        //Create a new thumbnail for the new slide
        var sdiv = document.createElement("div");
        sdiv.id = "slide" + (this.slides.length-1);
        sdiv.className = "slide";
        
        //Give the new thumbnail a canvas and arrow buttons to move it left and right
        sdiv.innerHTML = "<canvas id=\"canvas" + (tl.slides.length-1) + "\" width=\"" + (width/thumbScale) + "\" height=\"" + (height/thumbScale) + "\"></canvas><p>" + (tl.slides.length-1) + "</p>";
        
        sdiv.innerHTML += "<a class=\"lsf-icon larr\" title=\"Move Up\" id=\"arrowup\"></a>";
        sdiv.innerHTML += "<a class=\"lsf-icon close\" title=\"Remove Slide\" id=\"close\"></a>";
        sdiv.innerHTML += "<a class=\"lsf-icon rarr\" title=\"Move Down\" id=\"arrowdown\"></a>";
        sdiv.innerHTML += "<a class=\"lsf-icon copy\" title=\"Duplicate Slide\" id=\"copy\"></a>";
        
        var num = tl.slides.length-1;
        
        sdiv.getElementsByTagName("a")[0].onclick=function() {tl.moveLeft(event, ""+num);};
        sdiv.getElementsByTagName("a")[1].onclick=function() {tl.removeSlide(event, ""+num);};
        sdiv.getElementsByTagName("a")[2].onclick=function() {tl.moveRight(event, ""+num);};
        sdiv.getElementsByTagName("a")[3].onclick=function() {tl.duplicateSlide(event, ""+num);};
        
        //When the thumbnail is clicked, load its corresponding slide
        sdiv.onclick = function () {
            tl.loadSlide(""+num);
        }
        
        //Add the new thumbnail to the timeline
        document.getElementById("timeline").appendChild(sdiv);
        
        //Create a new "+" button
        var add = document.createElement("a");
        add.id = "add";
        add.style.width = (width/thumbScale) + "px";
        add.style.height = (height/thumbScale) + "px";
        add.style.lineHeight = (height/thumbScale) + "px";
        add.title = "Add New Slide";
        //add.href="#";
        add.innerHTML="+";
        
        //When it's clicked, add a new slide
        add.onclick = function () {
            tl.addSlide();
        }
            
        //add it to the timeline
        document.getElementById("timeline").appendChild(add);
        
        //Load this new slide that we just added
        tl.loadSlide(tl.slides.length-1);
    };

    //Moves the selected slide to the right
    this.moveRight = function(evt, position) {

        //Make sure the slide under the arrow doesn't trigger an event
        event.stopPropagation();

        //Get a number for the position
        if (typeof(position)=="string") {
            position=parseInt(position);
        }

        //if there is a slide to the right to swap with
        if (this.slides[position+1]) {

            //swap the slide variables
            var s=this.slides[position];
            this.slides[position]=this.slides[position+1];
            this.slides[position+1]=s;

            //switch the thumbs of the slide divs in the timeline
            switchThumbs(position, position+1);

            //Load the slide the event was called from
            if (this.currentSlide == position) {
                this.loadSlide(position+1);
            } else if (this.currentSlide == position+1) {
                this.loadSlide(position);
            }
        }
    };

    //Moves the selected slide to the left
    this.moveLeft = function(evt, position) {

        //Make sure the slide under the arrow doesn't trigger an event
        event.stopPropagation();

        //Get a number for the position
        if (typeof(position)=="string") {
            position=parseInt(position);
        }

        //if there is a slide to the right to swap with
        if (this.slides[position-1]) {

            //swap the slide variables
            var s=this.slides[position];
            this.slides[position]=this.slides[position-1];
            this.slides[position-1]=s;

            //switch the thumbs of the slide divs in the timeline
            switchThumbs(position, position-1);

            //Load the slide the event was called from
            if (this.currentSlide == position) {
                this.loadSlide(position-1);
            } else if (this.currentSlide == position-1) {
                this.loadSlide(position);
            }
        }
    };

    //When the X button on a slide has been clicked
    this.removeSlide = function(evt, position) {

        //Make sure the slide under the arrow doesn't trigger an event
        event.stopPropagation();

        //Get a number for the position
        if (typeof(position)=="string") {
            position=parseInt(position);
        }

        //If it's not the last slide
        if (this.slides.length>1) {

            //You can't undo it, so ask for a confirmation first
            var continueMsg = confirm("Are you sure you want to delete this slide? (Cannot be undone!)");
            if (continueMsg==true) {

                //Remove the div for the slide in the timeline
                var slideDiv = document.getElementById("slide" + position);
                if (slideDiv) {
                    slideDiv.parentNode.removeChild(slideDiv);
                }
                
                //Reset the numbers on all the remaining divs
                for (var i=1; i<this.slides.length; i++) {
                    var nextDiv = document.getElementById("slide" + (position+i));
                    if (nextDiv) {
                        var num = position+i-1;
                        nextDiv.id = "slide" + num;
                        nextDiv.getElementsByTagName("p")[0].innerHTML = "" + num;
                        nextDiv.getElementsByTagName("canvas")[0].id = "canvas" + num;
                        nextDiv.getElementsByTagName("a")[0].onclick=function() {tl.moveLeft(event, this.parentNode.getElementsByTagName("p")[0].innerHTML);};
                        nextDiv.getElementsByTagName("a")[1].onclick=function() {tl.removeSlide(event, this.parentNode.getElementsByTagName("p")[0].innerHTML);};
                        nextDiv.getElementsByTagName("a")[2].onclick=function() {tl.moveRight(event, this.parentNode.getElementsByTagName("p")[0].innerHTML);};
                        nextDiv.getElementsByTagName("a")[3].onclick=function() {tl.duplicateSlide(event, this.parentNode.getElementsByTagName("p")[0].innerHTML);};
                        nextDiv.onclick = function () {
                            var slideNum = this.getElementsByTagName("p")[0].innerHTML;
                            tl.loadSlide(slideNum);
                        }
                    }
                }
                
                //If the first div wasn't the one deleted, remove it from the middle
                if (position!=0) {
                    this.slides.splice(position, 1);

                //otherwise, shift the first one out
                } else {
                    this.slides.shift();
                }
                
                //Load either the next slide available or the last slide in the list
                if (this.slides[position]) {
                    this.loadSlide(position);
                } else {
                    this.loadSlide(this.slides.length);
                }
            }
        } else {

            //Just clear the stage
            this.clearStage();
        }
    };

    //When a tool button has been clicked
    this.setTool = function(t) {
        
        //Deselect old tool
        document.getElementById('tool'+tool).classList.remove('selected');
        
        //Select the new tool
        tool=t;

        document.getElementById('tool'+t).classList.add('selected');
        
        //If the pencil has been selected
        if (tool==0) {
            
            //Set the blend mode so that it draws normally
            stage.globalCompositeOperation = "source-over";
            
            //Set the colour to whatever is selected in the color picker
            this.setColour();
            
            //Make the colour picker visible, if it wasn't already
            document.getElementById('tool0colour').classList.remove('hidden');
            
            //Set the brush size dropdown to the correct item
            document.getElementById("pencilSize").selectedIndex=size-2;
            this.setSize();
            
        } else {
            
            //Hide the colour picker if its not the pencil tool
            document.getElementById('tool0colour').classList.add('hidden');
        }
        
        //IF the eraser tool is selected
        if (tool==1) {
            
            //Set the blend mode so it erases
            stage.globalCompositeOperation = "destination-out";
            stage.strokeStyle = "rgba(0,0,0,1.0)";
            
            //Set the brush size to the previously set eraser size
            document.getElementById("pencilSize").selectedIndex=eraserSize-2;
            this.setSize();
        }
    };

    //When the colour picker is changed
    this.setColour = function() {
        
        col = document.getElementById("colourBox").value;
        
        //Set the colour preview's background colour
        document.getElementById("tool0colour").style.backgroundColor=col;
        
        //set the stage colour accordingly
        stage.strokeStyle=col;
        stage.fillStyle=col;
    };

    //When the brush size dropdown has been changed
    this.setSize = function() {
        
        //Get a reference to the dropdown
        var dropdown=document.getElementById("pencilSize");
        
        //If the pencil tool is selected, update the size and set the preview based on the size
        if (tool==0) {
            size=parseInt(dropdown.options[dropdown.selectedIndex].value);
            stage.lineWidth=size;
            document.getElementById("preview").style.width=size + "px";
            document.getElementById("preview").style.height=size + "px";
            document.getElementById("preview").style.marginLeft=(30 - size)/2 + "px";
            document.getElementById("preview").style.marginTop=(30 - size)/2 + "px";
            document.getElementById("preview").style.borderRadius=size/2 + "px";
            document.getElementById("preview").style.webkitBorderRadius=size/2 + "px";
            
        //If the eraser tool is selected, update the eraser size and set the preview based on the eraser size
        } else if (tool==1) {
            eraserSize=parseInt(dropdown.options[dropdown.selectedIndex].value);
            stage.lineWidth=eraserSize;
            document.getElementById("preview").style.width=eraserSize + "px";
            document.getElementById("preview").style.height=eraserSize + "px";
            document.getElementById("preview").style.marginLeft=(30 - eraserSize)/2 + "px";
            document.getElementById("preview").style.marginTop=(30 - eraserSize)/2 + "px";
            document.getElementById("preview").style.borderRadius=eraserSize/2 + "px";
            document.getElementById("preview").style.webkitBorderRadius=eraserSize/2 + "px";
        }
    };

    this.addHistory = function() {
        history.createHistory(stage.getImageData(0, 0, width, height));
        this.changed=true;
        updateThumb();
    }

    //Erases everything on the stage
    this.clearStage = function(init) {
        
        //Make a blank image and replace what's on the stage with it
        var blank = stage.createImageData(width, height);
        stage.putImageData(blank, 0, 0);
        
        //If this isn't the creation of a brand new slide, make this change a step in history that can be undone
        if (!init) {
            tl.addHistory();
            /*history.createHistory(stage.getImageData(0, 0, width, height));
            this.changed=true;*/
        }
    };

    this.drawImage = function(img) {
        stage.drawImage(img,0,0);
        updateThumb();
    }

    var getMousePos = function(canvas, evt) {
        var rect = canvas.getBoundingClientRect()
        var root = document.documentElement;
        
        // return relative mouse position
        var mouseX = evt.clientX - rect.left - root.scrollLeft;
        var mouseY = evt.clientY - rect.top - root.scrollTop;
        
        return {
            x: mouseX,
            y: mouseY
        };
    }.bind(this);

    this.startDraw = function(evt) {
        mousePos = getMousePos(canvas, evt);

        stage.beginPath();
        if (tool==0) {
            stage.arc(mousePos.x, mousePos.y, size/2, 0, Math.PI*2, true);
        } else if (tool==1) {
            stage.arc(mousePos.x, mousePos.y, eraserSize/2, 0, Math.PI*2, true);
        }
        stage.closePath();
        stage.fill();

        document.activeElement.blur();

        canvas.addEventListener("mousemove", tl.draw, true);
        //canvas.onmousemove = this.draw(event);
        document.addEventListener("mouseup", tl.endDraw, true);
    }.bind(this);

    this.clicked = function(evt) {
        canvas.removeEventListener("mousemove", tl.draw, true);
        document.removeEventListener("mouseup", tl.endDraw, true);
        
        mousePos = getMousePos(canvas, evt);
        stage.beginPath();
        if (tool==0) {
            stage.arc(mousePos.x, mousePos.y, size/2, 0, Math.PI*2, true);
        } else if (tool==1) {
            stage.arc(mousePos.x, mousePos.y, eraserSize/2, 0, Math.PI*2, true);
        }
        stage.closePath();
        stage.fill();
        
        tl.addHistory();
    };

    this.draw = function(evt) {
        var mp = getMousePos(canvas, evt);
        stage.beginPath();
        stage.moveTo(mousePos.x, mousePos.y);
        stage.lineTo(mp.x, mp.y);
        stage.stroke();
        mousePos=mp;
        //canvas.removeEventListener("mouseup", tl.clicked, true);
    };

    this.endDraw = function(evt) {
        canvas.removeEventListener("mousemove", tl.draw, true);
        document.removeEventListener("mouseup", tl.endDraw, true);
        var histTimer = setTimeout(function() {tl.addHistory();}, 5);
        //canvas.addEventListener("mouseup", tl.clicked, true);
    };

    this.undo = function() {
        if (history.historyPosition>-1) {
            history.historyPosition--;
            stage.putImageData(history.history[history.historyPosition], 0, 0);
        }
        updateThumb();
    };

    this.redo = function() {
        if (history.historyPosition<history.history.length-1) {
            history.historyPosition++;
            stage.putImageData(history.history[history.historyPosition], 0, 0);
        }
        updateThumb();
    };

    

    this.startPlayback = function() {
        tl.playbackSlide = tl.currentSlide;
        tl.playSlide();
    }

    this.playSlide = function() {
        if (this.slides[this.playbackSlide]) {
            theatre.putImageData(this.slides[this.playbackSlide].img, 0, 0);
            this.playbackTimer = setTimeout(function() {
                clearInterval(tl.playbackTimer);
                tl.playbackSlide++;
                tl.playSlide();
            }, tl.slides[tl.playbackSlide].duration*1000)
        } else {
            this.closeTheatre();
        }
    }

    this.playPause = function() {
        if (tl.playbackTimer==0) {
            document.getElementById("pause").innerHTML = '<span class="lsf-icon" id="pause"></span>';
            tl.playSlide();
        } else {
            document.getElementById("pause").innerHTML = '<span class="lsf-icon" id="play"></span>';
            clearInterval(tl.playbackTimer);
            tl.playbackTimer=0;
        }
    }

    this.nextSlide = function() {
        clearInterval(tl.playbackTimer);
        tl.playbackSlide++;
        if (tl.playbackTimer==0) {
            document.getElementById("pause").innerHTML = '<span class="lsf-icon" id="pause"></span>';
        }
        tl.playSlide();
    }

    this.prevSlide = function() {
        if (tl.playbackSlide>0) {
            tl.playbackSlide--;
        }
        if (tl.playbackTimer==0) {
            document.getElementById("pause").innerHTML = '<span class="lsf-icon" id="pause"></span>';
        }
        clearInterval(tl.playbackTimer);
        tl.playSlide();
    }

    this.restartShow = function() {
        tl.playbackSlide=0;
        if (tl.playbackTimer==0) {
            document.getElementById("pause").innerHTML = '<span class="lsf-icon" id="pause"></span>';
        }
        clearInterval(tl.playbackTimer);
        tl.playSlide();
    }

    this.closeTheatre = function() {
        document.getElementById('playback').style.display='none';
        document.getElementById('fade').style.display='none';
        clearInterval(tl.playbackTimer);
        tl.playbackTimer=0;
    }

    //See if the browser supports canvas
    if (canvas.getContext) {
        
        //Get the canvas context to draw onto
        stage = canvas.getContext("2d");

        theatre = theatreCanvas.getContext("2d");

        //Clear canvas
        this.loadSlide(-1);
        
        stage.strokeStyle="#000000";
        stage.lineWidth=size;
        stage.lineCap="round";
        
        canvas.onselectstart = function () { return false; }; // ie
        canvas.onmousedown = function () { return false; }; // mozilla
        
        //Start drawing
        canvas.addEventListener("mousedown", this.startDraw, true);
        //canvas.addEventListener("mouseup", this.clicked, true);

    } else {
        alert("No canvas support!");
    }

    document.getElementById("tool0").onclick = function() {
        tl.setTool(0);
    };
    document.getElementById("tool1").onclick = function() {
        tl.setTool(1);
    };
    document.getElementById("clear").onclick = function() {
        tl.clearStage();
    };

    document.getElementById("rough").onchange = this.updateProgress;
    document.getElementById("final").onchange = this.updateProgress;
    document.getElementById("colored").onchange = this.updateProgress;
    document.getElementById("background").onchange = this.updateProgress;
    document.getElementById("sound").onchange = this.updateProgress;
    document.getElementById("duration").onchange = this.updateProgress;

    document.getElementById("pencilSize").onchange = this.setSize;

    document.getElementById("colourBox").onchange = this.setColour;

    document.getElementById("playSlides").onclick = function() {
        document.getElementById('playback').style.display='block';
        document.getElementById('fade').style.display='block';
        tl.startPlayback();
    };

    document.getElementById("fade").onclick = function() {
        document.getElementById('settings').style.display='none';
        document.getElementById('about').style.display='none';
        document.getElementById('fade').style.display='none';
        tl.closeTheatre();
    }

    document.getElementById("stop").onclick = this.closeTheatre;
    document.getElementById("pause").onclick = this.playPause;
    document.getElementById("fwd").onclick = this.nextSlide;
    document.getElementById("back").onclick = this.prevSlide;
    document.getElementById("restart").onclick = this.restartShow;
}


//Class for managing the project
function Storyboard() {
    this.timeline = new Timeline();

    var percentComplete=0;
    var lastPercentComplete=0;
    var currentRate=0;

    var version = 0.82;

    var startDate = new Date();
    var endDate = new Date();
    var lastEdited = new Date();
    var now = new Date();

    this.loadedImages = [];

    var sb=this;

    //where the XML from an opened file will be loaded into
    var slideData;

    //Reset the board
    this.reset = function() {
        //Reset everything

        this.timeline.reset();
        
        startDate = new Date();
        endDate = new Date();
        lastEdited = new Date();
        now = new Date();

        document.getElementById("boardTitle").value="Untitled Board";
        
        percentComplete=0;
        lastPercentComplete=0;
    };

    //Clear the board for loading in a file
    this.clear = function() {
        //Reset everything

        this.timeline.clear();
        
        startDate = new Date();
        endDate = new Date();
        lastEdited = new Date();
        now = new Date();

        document.getElementById("boardTitle").value="Untitled Board";
        
        percentComplete=0;
        lastPercentComplete=0;
    };

    //Get a string of yyyy-mm-dd from a Date variable
    var dateString = function(date) {

        //If it isn't a date variable, stop right here and go no further
        if (typeof(date) != "object") {
            alert(date + " is not a valid date!");
            return;
        }

        //Make the string and return it
        var month = (date.getMonth() + 1);
        var day = date.getDate();
        if(month < 10) 
            month = "0" + month;
        if(day < 10) 
            day = "0" + day;
        var currentDateString = date.getFullYear() + '-' + month + '-' + day;
        return currentDateString;
    }.bind(this);

    // parse a date in yyyy-mm-dd format
    var parseDate = function(input) {
        var parts = input.match(/(\d+)/g);
        if (parts.length!=3) return false;

        //new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
        return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
    }.bind(this);

    //Updates the stored date variables from the date picker data
    this.setDate = function() {

        //Update the current time again, just in case it's flipped over to the next day
        now = new Date();

        //If the user hasn't cleared the date bar and it's valid input, get a Date() from that
        if (document.getElementById("startDate").value!="" && parseDate(document.getElementById("startDate").value)) {
            startDate = parseDate(document.getElementById("startDate").value);

        //Otherwise, make it the current date
        } else {
            document.getElementById("startDate").value=dateString(now);
        }
        
        //Do it again!
        if (document.getElementById("endDate").value!="" && parseDate(document.getElementById("endDate").value)) {
            endDate = parseDate(document.getElementById("endDate").value);
        } else {
            document.getElementById("endDate").value=dateString(now);
        }
        
        //Display the number of days between now and the deadline
        if ((Math.round((( endDate - now ) / 86400000)+0.5))==0) {
            document.getElementById("daysLeft").innerHTML = "DUE IN LESS THAN 24 HOURS!";
        } else {
            document.getElementById("daysLeft").innerHTML = "Due around " + (Math.abs(Math.round((( endDate - now ) / 86400000)+0.5))) + " day" + ((Math.abs(Math.round((( endDate - now ) / 86400000)+0.5)))==1 ? "" : "s") + ((Math.round((( endDate - now ) / 86400000)+0.5))>0 ? " from now" : " ago");
        }
    };

    //Updates the date picker values from the stored date variables
    this.updateDate = function() {

        //Set the value of the date picker to the value from the Date variable
        document.getElementById("startDate").value=dateString(startDate);

        //Re-parse the date variable because it glitches out sometimes for weird reasons
        startDate = parseDate(document.getElementById("startDate").value);
        
        //Do it again!
        document.getElementById("endDate").value=dateString(endDate);
        endDate = parseDate(document.getElementById("endDate").value);
        
        //Update the current time in case it's a new day
        now = new Date();
        
        //Display the number of days between now and the deadline
        if ((Math.round((( endDate - now ) / 86400000)+0.5))==0) {
            document.getElementById("daysLeft").innerHTML = "DUE IN LESS THAN 24 HOURS!";
        } else {
            document.getElementById("daysLeft").innerHTML = "Due around " + (Math.abs(Math.round((( endDate - now ) / 86400000)+0.5))) + " day" + ((Math.abs(Math.round((( endDate - now ) / 86400000)+0.5)))==1 ? "" : "s") + ((Math.round((( endDate - now ) / 86400000)+0.5))>0 ? " from now" : " ago");
        }
    };

    //Calculate the progress of the project
    this.calculateProgress = function(init) {

        //Get the total possible checks (adjusted with the duration of their slides) and how much has been done
        var total=0;
        var done=0;
        for (var i=0; i<this.timeline.slides.length; i++) {
            total+=5*this.timeline.slides[i].duration;
            if (this.timeline.slides[i].roughAnimated) done += this.timeline.slides[i].duration;
            if (this.timeline.slides[i].finalAnimated) done += this.timeline.slides[i].duration;
            if (this.timeline.slides[i].colored) done += this.timeline.slides[i].duration;
            if (this.timeline.slides[i].background) done += this.timeline.slides[i].duration;
            if (this.timeline.slides[i].sound) done += this.timeline.slides[i].duration;
        }

        //Get the current percent complete, to one decimal place
        percentComplete=Math.round(done/total*1000)/10;
        
        //If this isn't being called right after loading a file, update the rate of completion
        if (!init && percentComplete != lastPercentComplete) {
                currentRate = percentComplete-lastPercentComplete;
        }
        
        //If it is being called upon loading a new file
        if (init) {

            //if it was last edited today, adjust lastEdited so we can add on to the day's rate of completion
            if (dateString(now) == dateString(lastEdited)) {
                lastPercentComplete = percentComplete - currentRate;
            } else {
                lastPercentComplete = percentComplete;
            }
        }
        
        //update the current date
        now = new Date();

        //Get the average rate of completion and display everything
        var averageRate = Math.round(percentComplete/(Math.round((( now - startDate ) / 86400000)+0.5))*10)/10;

        var projectionCurrent = "";
        var days=0;
        if (currentRate<=0) {
            projectionCurrent = "At your current rate, you won't finish.";
        } else {
            days=1;
            while (percentComplete + currentRate*days<100) days++;
            projectionCurrent = "At your current rate, you will finish in " + days + " day" + (days==1 ? "" : "s") + ".";
        }

        var projectionAverage = "";
        var days2=0;
        if (averageRate<=0) {
            if (days==0) {
                projectionAverage = "At your average rate, you still won't finish. Better get to work on that.<br /><br /><Strong>Check off the parts of each slide you've completed</strong> if you haven't already!";
            } else {
                projectionAverage = "At your average rate, you won't finish.";
            }
        } else {
            days2=1;
            while (percentComplete + averageRate*days2<100) days2++;
            projectionAverage = "At your average rate, you will finish in " + days2 + " day" + (days2==1 ? "" : "s") + ".";
        }

        document.getElementById("percentComplete").innerHTML = percentComplete + "% complete";
        document.getElementById("currentRate").innerHTML = "Current rate: " + currentRate + "%/day<br />Average rate: " + averageRate + "%/day";
        document.getElementById("projection").innerHTML = projectionCurrent + "<br />" + projectionAverage;
    };

    //Creates a string of XML to be saved
    this.saveXML = function() {

        //Save a copy of the current slide number so that we can go back to where we were before at the end.
        var s = this.timeline.currentSlide;
        
        //Get the title and put it in the form we are going to submit
        document.getElementById("formTitle").value = document.getElementById("boardTitle").value || "Untitled Storyboard";
        if (document.getElementById("formTitle").value == "") {
            document.getElementById("formTitle").value = "Untitled Storyboard";
        }

        //Add the metadata
        var xmlData = "<storyboard>";
        xmlData += "<title>" + encodeURI(document.getElementById("boardTitle").value) + "</title>";
        xmlData += "<version>" + version + "</version>";
        xmlData += "<startDate>" + dateString(startDate) + "</startDate>";
        xmlData += "<endDate>" + dateString(endDate) + "</endDate>";
        xmlData += "<lastEdited>" + dateString(now) + "</lastEdited>";
        xmlData += "<currentRate>" + currentRate + "</currentRate>";
        
        //Add all the slides data
        for (var i=0; i<this.timeline.slides.length; i++) {

            //Load the slide
            this.timeline.loadSlide(i);

            xmlData+="<slide>";

            //Get the base64 string of the image
            xmlData+="<data>" + this.timeline.getDataURI() + "</data>";

            //Add the slide metadata
            xmlData+="<roughAnimated>" + this.timeline.slides[i].roughAnimated + "</roughAnimated>";
            xmlData+="<finalAnimated>" + this.timeline.slides[i].finalAnimated + "</finalAnimated>";
            xmlData+="<colored>" + this.timeline.slides[i].colored + "</colored>";
            xmlData+="<background>" + this.timeline.slides[i].background + "</background>";
            xmlData+="<sound>" + this.timeline.slides[i].sound + "</sound>";
            xmlData+="<duration>" + this.timeline.slides[i].duration + "</duration>";
            xmlData+="</slide>";        
        }

        //Conclude the xml and stick it in the form
        xmlData+="</storyboard>";

        //Load the slide we were on originally
        this.timeline.loadSlide(s);

        return xmlData;
    };

    this.handleXML = function(slidesXML) {
        //Get the slides data, to be parsed individually
        slideData=slidesXML.getElementsByTagName("slide");
        
        //If it was made in an earlier version, there might be some bugs, so botify the user.
        var versionInfo=slidesXML.getElementsByTagName("version");
        if (versionInfo.length==0 || parseFloat(versionInfo[0].childNodes[0].data)<version) {
            alert("This file has been created in an earlier version of the program. We'll try to make everything work, but if you notice any glitches, submit a bug report.");
        }
        
        //Get the metadata
        var titleData=slidesXML.getElementsByTagName("title");
        if (titleData.length>0) {
            decodeURI(document.getElementById("boardTitle").value=titleData[0].childNodes[0].data);
        }
        
        var startDateData=slidesXML.getElementsByTagName("startDate");
        if (startDateData.length>0) {
            startDate=parseDate(startDateData[0].childNodes[0].data);
        }
        
        var endDateData=slidesXML.getElementsByTagName("endDate");
        if (endDateData.length>0) {
            endDate=parseDate(endDateData[0].childNodes[0].data);
        }
        
        var lastEditedData=slidesXML.getElementsByTagName("lastEdited");
        if (lastEditedData.length>0) {
            lastEdited=parseDate(lastEditedData[0].childNodes[0].data);
        }
        
        var rateData=slidesXML.getElementsByTagName("currentRate");
        if (rateData.length>0) {
            currentRate=parseFloat(rateData[0].childNodes[0].data);
        }

        //Load the first slide
        this.loadSlideXml(0);
    };

    //Loads the i'th slide from the loaded XML
    this.loadSlideXml = function(i) {

        //If there's still a slide to load (they're not all done)
        if (slideData[i]) {

            //Add a new slide
            this.timeline.addSlide();

            //Give the slide the loaded metadata
            if (slideData[i].getElementsByTagName("roughAnimated").length>0) {
                this.timeline.slides[this.timeline.currentSlide].roughAnimated = slideData[i].getElementsByTagName("roughAnimated")[0].childNodes[0].data=="true"||false;
            } else {
                this.timeline.slides[this.timeline.currentSlide].roughAnimated = false;
            }
            if (slideData[i].getElementsByTagName("finalAnimated").length>0) {
                this.timeline.slides[this.timeline.currentSlide].finalAnimated = slideData[i].getElementsByTagName("finalAnimated")[0].childNodes[0].data=="true"||false;
            } else {
                this.timeline.slides[this.timeline.currentSlide].finalAnimated = false;
            }
            if (slideData[i].getElementsByTagName("colored").length>0) {
                this.timeline.slides[this.timeline.currentSlide].colored = slideData[i].getElementsByTagName("colored")[0].childNodes[0].data=="true"||false;
            } else {
                this.timeline.slides[this.timeline.currentSlide].colored = false;
            }
            if (slideData[i].getElementsByTagName("background").length>0) {
                this.timeline.slides[this.timeline.currentSlide].background = slideData[i].getElementsByTagName("background")[0].childNodes[0].data=="true"||false;
            } else {
                this.timeline.slides[this.timeline.currentSlide].background = false;
            }
            if (slideData[i].getElementsByTagName("sound").length>0) {
                this.timeline.slides[this.timeline.currentSlide].sound = slideData[i].getElementsByTagName("sound")[0].childNodes[0].data=="true"||false;
            } else {
                this.timeline.slides[this.timeline.currentSlide].sound = false;
            }
            if (slideData[i].getElementsByTagName("duration").length>0) {
                this.timeline.slides[this.timeline.currentSlide].duration = parseFloat(slideData[i].getElementsByTagName("duration")[0].childNodes[0].data)||1;
            } else {
                this.timeline.slides[this.timeline.currentSlide].duration = 1;
            }

            //Load the slide so the image can be put on the canvas
            this.timeline.loadSlide();

            //Make a new image
            this.loadedImages.push(new Image);

            //Only when the image is loaded, load the next image, so the canvas doesn't get overwritten or something
            this.loadedImages[this.loadedImages.length-1].onload = function() {

                //Draw the image to the canvas so the thumbnail can be updated
                //sb.timeline.stage.drawImage(img,0,0);
                //document.getElementById("output").appendChild(img);
                sb.timeline.drawImage(this);
                
                
                //Load the next slide
                var next=i+1;
                sb.loadSlideXml(next);
            };

            //Load the image
            this.loadedImages[this.loadedImages.length-1].src=slideData[i].getElementsByTagName("data")[0].childNodes[0].data;

        //If all the images are loaded, calculate the progress and go to the first slide
        } else {
            this.updateDate();
            this.calculateProgress(true);
            this.timeline.loadSlide(0);
            for (var i=0; i<this.loadedImages.length; i++) {
                delete this.loadedImages[i];
            }
            this.loadedImages = [];

            document.getElementById("loading").style.display = "none";
            document.getElementById("fade2").style.display = "none";
        }
    };

    //Put the current version in the About popup
    document.getElementById("aboutTitle").innerHTML+=version;

    document.getElementById("settingsButton").onclick = function() {
        document.getElementById('settings').style.display='block';
        document.getElementById('fade').style.display='block';
        sb.calculateProgress();
    };
    document.getElementById("aboutButton").onclick = function() {
        document.getElementById('about').style.display='block';
        document.getElementById('fade').style.display='block';
    };

    document.getElementById("startDate").onchange = this.setDate;
    document.getElementById("endDate").onchange = this.setDate;
    
    //Set the initial values for the date pickers
    this.updateDate();
}

//function to manage toolbars, controls, etc
function CoolStory() {

    this.board = new Storyboard();
    var cs = this;

    //When the "New" button has been clicked
    this.newFile = function() {

        //If modifications have been made to the file, make sure the user knows that making anything new will lose the changes
        if (cs.board.timeline.changed) {
            var continueMsg = confirm("You have unsaved changes. Are you sure you want to create a new storyboard?");
            if (continueMsg==false) {
                return;
            }
        }
        
        cs.board.reset();
    };

    this.saveFile = function() {
        //Get the string of XML data
        var xmlString = cs.board.saveXML();

        //The form we are going to submit
        var form = document.forms.save;

        document.getElementById("formData").value=xmlString;

        //submit the form
        form.submit();
    };

    this.saveFileLocal = function() {

        document.getElementById("loading").style.display = "block";
        document.getElementById("fade2").style.display = "block";

        var saveTimer = setTimeout(cs.finishSave, 10);
    };

    this.finishSave = function() {
        //Get the string of XML data
        var xmlString = cs.board.saveXML();

        //The form we are going to submit
        var form = document.forms.save;

        document.getElementById("loading").style.display = "none";
        document.getElementById("fade2").style.display = "none";

        document.getElementById("save").style.display = "block";
        document.getElementById("fade").style.display = "block";
        document.getElementById("download").href = "data:application/octet-stream;charset=utf-8," + xmlString;
        document.getElementById("download").download = "" + document.getElementById("boardTitle").value + ".xml";
    }

    //Because browsers treat XML parsing differently, assing whatever function works to the parseXml function
    var parseXml;
    if (typeof window.DOMParser != "undefined") {
        parseXml = function(xmlStr) {
            return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
        }.bind(this);
    } else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
        parseXml = function(xmlStr) {
            var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = "false";
            xmlDoc.loadXML(xmlStr);
            return xmlDoc;
        }.bind(this);
    } else {
        throw new Error("No XML parser found");
    }

    this.loadFile = function(evt) {
        //If modifications have been made to the file, make sure the user knows that making anything new will lose the changes
        if (cs.board.timeline.changed) {
            var continueMsg = confirm("You have unsaved changes. Are you sure you want to open this storyboard?");
            if (continueMsg==false) {
                return;
            }
        }

        document.getElementById("loading").style.display = "block";
        document.getElementById("fade2").style.display = "block";
        
        cs.board.clear();
        
        //Get the files selected for opening
        var files = evt.target.files; // FileList object

        // Loop through the FileList
        var f=files[0];

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {

                //Split the XML string into DOM nodes
                var slidesXML = parseXml(e.target.result);

                cs.board.handleXML(slidesXML);
            };
        })(f);

        // Read in the file
        reader.readAsText(f, "UTF-8");

        document.getElementById("fileSelector").innerHTML = document.getElementById("fileSelector").innerHTML;
        document.getElementById("filePicker").onchange = cs.loadFile;
    };

    this.docKeyUp = function(e) {
        if (e.ctrlKey && e.keyCode == 90) {
            cs.board.timeline.undo();
            document.activeElement.blur();
            e.preventDefault();
            return false;
        } else if (e.ctrlKey && e.keyCode == 89) {
            cs.board.timeline.redo();
            document.activeElement.blur();
            e.preventDefault();
            return false;
        } else if (e.ctrlKey && e.keyCode == 83) {
            cs.saveFileLocal();
            document.activeElement.blur();
            e.preventDefault();
            return false;
        } else if (e.ctrlKey && e.keyCode == 79) {
            document.getElementById("filePicker").click();
            document.activeElement.blur();
            e.preventDefault();
            return false;
        }
    };

    //Listen for keyboard shortcuts
    document.addEventListener('keydown', this.docKeyUp);
    document.getElementById("newButton").onclick = this.newFile;
    //document.getElementById("saveButton").onclick = this.saveFile;
    document.getElementById("saveButton").onclick = this.saveFileLocal;
    document.getElementById("filePicker").onchange = this.loadFile;
}

//Start up the program
function init() {
    var cs = new CoolStory();
    var loadTimer = setTimeout(function() {
        document.getElementById("loading").style.display = "none";
        document.getElementById("fade2").style.display = "none";
    }, 1000);
}