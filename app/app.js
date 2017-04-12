define(['jquery', 'ractive', 'rv!templates/template', 'text!css/my-widget_embed.css','moment', 'jqueryUi','spreadsheets'], function ($, Ractive, template, css, moment, autocomplete,spreadsheets) {

  'use strict';

//document.getElementById('one')

  var app = {
    init: function () {


    var $style = $("<style></style>", {type: "text/css"});
    var width = document.getElementById('omnistory-widget').getAttribute('width');
    var height = document.getElementById('omnistory-widget').getAttribute('height');
    var jsonData = document.getElementById('omnistory-widget').getAttribute('data');
    var errorChecking = false;
    var json = [];
    var dateRange;
    var amtSides = 2;
    var amtEvents = 8;


    //option to start expanded
    //triangle and/or .. encircled
    //make mouse over
    //swipe on mobile instead of carets
    //put colors on title slide instead of label in side
    //emphasize material design all the way

    //denotes space between the major axis'
    var spaceBetweenMajors = 150;
    var durationOfFadeAnimations = 750;
    var durationOfChangeEventAnimations = 800;

    var sideInfo = [["American Colonists","#6891E2","The Thirteen Colonies were a group of British colonies on the east coast of North America founded in the 17th and 18th centuries that declared independence in 1776 and formed the United States. The thirteen were (roughly north to south): Province of New Hampshire, Province of Massachusetts Bay, Colony of Rhode Island and Providence Plantations, Connecticut Colony, Province of New York, Province of New Jersey, Province of Pennsylvania, Delaware Colony, Province of Maryland, Colony of Virginia, Province of North Carolina, Province of South Carolina, and Province of Georgia."],["British Empire","#CD2020","British Empire, overseas territories linked to Great Britain in a variety of constitutional relationships, established over a period of three centuries. The establishment of the empire resulted primarily from commercial and political motives and emigration movements (see imperialism); its long endurance resulted from British command of the seas and preeminence in international commerce, and from the flexibility of British rule. At its height in the late 19th and early 20th cent., the empire included territories on all continents, comprising about one quarter of the world's population and area. Probably the outstanding impact of the British Empire has been the dissemination of European ideas, particularly of British political institutions and of English as a lingua franca, throughout a large part of the world."]];


    //first array is first level
    //second array is second level
    //from 2-however many of the rest there are the keys underneath the first array
    var jsonLevels = this.establishProperStructure(amtSides, amtEvents);

    //three main inputs of data are through json and by a link that returns json, and lastly google spreadsheet with specific format
    //if json is valid
    //if it is parses it
    if(this.checkIfGoogleDoc(jsonData, errorChecking)){
        json = this.parseGoogleDoc(jsonData, errorChecking, sideInfo);
    }
    else if (this.checkIfJsonValid(jsonData, errorChecking)) {
        json = JSON.parse(jsonData);
    }
    // if input is valid url it parses data into an array
    else if(this.ValidUrL(jsonData, errorChecking)) {
        this.getJSON(jsonData,
        function(err, data) {
          if (err != null) {
            alert("Url didn't return json, you could possibly have invalid json or a mistake in your url.");
          } else {
              json = data;
          }
        });
    }
    else {
        alert("Not valid json or url");
    }

    //gets min and max range for timeline scale
    var dateRange = this.getMinAndMax(json.events, errorChecking);

    //any variables not given in json are turned into empty strings
    //json = this.cleanUpValues(json,errorChecking,jsonLevels);

    //reformats all the dates to be a better format
    var date_arr = this.reformatAllDates(json.events);

    //gets all the colors necessary for styling everything
    //first number is which side to choose, second is which color
    //ex [0][0] => first side's opaque color
    var colors = this.getColors(json.title.sides.side0.color, json.title.sides.side1.color);

    //creates timeline axis
    var timelineTicks = this.createTimelineTicks(dateRange);

    //creates object of all events
    var allEvents = this.getAllEvents(json.events, dateRange, spaceBetweenMajors/5);

    //adds css to page
    $style.text(css);
    $("head").append($style);

    console.log(json);

    setTimeout(function(){
          // render main view
          this.ractive = new Ractive({
            el: 'omnistory',
            template: template,
            magic: true,
            data: {
              width: width,
              height: height,
              json: json,
              sides: json.title.sides,
              range: dateRange[0] + " - " + dateRange[1],
              date_array: date_arr,
              timelineTicks: timelineTicks,
              allEvents: allEvents[0],
              sidesText: allEvents[1]
            },
            oncomplete: function(){
                var n = 1;

                //tracks if timeline is open or closed
                var statusOfTimeline;

                //checks whether animation is currently happening
                var animationHappening = false;

                //goes through all major and minor axis' and makes their positioning right
                $("._axisMajor").each(function() {
                    var currLeftPost = n*spaceBetweenMajors;
                    console.log(currLeftPost);
                    $(this).css("left",currLeftPost);
                    var whichMinor = 1;
                    $(this).find("._axisMinor").each(function() {
                        var currLeftMinor = whichMinor * (spaceBetweenMajors/5);
                        $(this).css("left",currLeftMinor);
                        whichMinor++;
                    });
                    n++;
                });

                var lastMinorLeft = $("._axisMinor:last-child").css("left");
                var lastMajorLeft = $("._axisMajor:last-child").css("left");

                //determines and sets width of all of the timeline content (axis)
                var widthOfTimelineContent = parseInt(lastMinorLeft.substring(0,lastMajorLeft.length-2)) + parseInt(lastMajorLeft.substring(0,lastMajorLeft.length-2)) + 10;
                $("#_axis").css("width",widthOfTimelineContent);

                //sets left positioning of all of the events
                var whichEvent = 0;
                $("._event").each(function() {
                    $(this).css("left",allEvents[0][whichEvent][3]);
                    //console.log(allEvents[whichEvent][3]);
                    whichEvent++;
                });

                var makeEventActive = function(titleOrNormal,curr_color, makeEventActiveSelector, which, event, duration) {
                    if($("._event._active").css("left")) {
                        adjustForAnimation("._event._active","right",2)
                    }
                    $("._active").removeClass("_active _clicked");

                    if(titleOrNormal === "start") {
                        makeEventActiveSelector = ".title-icon";
                    }

                    $(makeEventActiveSelector).addClass("_clicked");
                    setTimeout(function(){
                        $(makeEventActiveSelector).addClass("_active _clicked");

                        //moves event bubble over 2 px to account for the change of size
                        adjustForAnimation(makeEventActiveSelector,"left",2)

                        if(titleOrNormal === "start" || titleOrNormal === "title") {
                            $(makeEventActiveSelector + "-after").addClass("_active _clicked");
                        }

                        if(!animationHappening) {
                            if(titleOrNormal != "start") {
                                setEverythingToColors(curr_color, "change", event, duration);
                            }
                            else {
                                setEverythingToColors(curr_color, "start", event, duration);
                            }
                        }
                    }, 100);
                };


                //function that allows the event bubble to move right or left
                //necessary because design uses the event's before as the dotted line
                //and it moves when it is resized after being clicked on
                var adjustForAnimation = function(selector, leftOrRight, amt) {
                    if(leftOrRight === "left") {
                        var oldLeft = parseInt($(selector).css("left").substr(0,$(selector).css("left").length-2));
                        var newLeftPost = oldLeft - amt;
                        //console.log("Old: " + oldLeft);
                        //console.log(newLeftPost + "px");
                        $(selector).css("left",newLeftPost);
                    }
                    else if(leftOrRight === "right") {
                        var oldLeft = parseInt($(selector).css("left").substr(0,$(selector).css("left").length-2));
                        var newLeftPost = oldLeft + amt;
                        //console.log("Old: " + oldLeft);
                        //console.log(newLeftPost + "px");
                        $(selector).css("left",newLeftPost);
                    }
                }

                //sets the colors for the keys
                var setKeyColors = function(color1, color1Shadow, color2, color2Shadow) {
                    $("._key-color1").css("background-color", color1);
                    $("._key-color2").css("background-color", color2);
                };


                //hides elements that go beyond certain point to the right and left of the axis
                var hide_axis = function(classToCheck, durationOfFade, startOrNah) {
                    var original_line_left = $("._line").offset().left;
                    var original_line_right = original_line_left + $("._line").width();

                    $("." + classToCheck).each(function() {
                        var offset = $(this).offset();
                        var posLeft;
                        var posRight;

                        if(classToCheck === "_event") {
                            posLeft = offset.left - 58;
                            posRight = offset.left + 23;
                        }
                        else {
                            posLeft = offset.left - 65;
                            posRight = offset.left + 20;
                        }



                        //left side
                        if(posLeft < original_line_left) {
                            //left side minor
                            if(classToCheck === "_axisMinor" || classToCheck === "_event") {
                                $(this).css("opacity", 0);
                            }
                            //left side major
                            else if (classToCheck === "_axisMajor"){
                                $(this).css("background-color", "transparent");
                                $(this).find("._YearMajor").hide();
                            }

                            //left side add the class
                            $(this).addClass("_axis-hidden-left");
                        }
                        else if(posRight > original_line_right){
                            //right side minor
                            if(classToCheck === "_axisMinor" || classToCheck === "_event") {
                                $(this).css("opacity", 0);
                            }
                            //right side major
                            else if (classToCheck === "_axisMajor"){
                                $(this).css("background-color", "transparent");
                                $(this).find("._YearMajor").hide();
                            }

                            //right side add the class
                            $(this).addClass("_axis-hidden-right");
                        }

                        if($(this).hasClass("_axis-hidden-left")) {
                            if(posLeft > original_line_left) {
                                if(classToCheck === "_axisMinor" || classToCheck === "_event") {
                                    $(this).css("opacity", 1);
                                }
                                else if (classToCheck === "_axisMajor"){
                                    $(this).css("background-color", "#000000");
                                    $(this).find("._YearMajor").show();
                                }

                                //left side remove the class
                                $(this).removeClass("_axis-hidden-left");
                            }
                        }
                        else if($(this).hasClass("_axis-hidden-right")) {
                            if(posRight < original_line_right) {
                                if(classToCheck === "_axisMinor" || classToCheck === "_event") {
                                    $(this).css("opacity", 1);
                                }
                                else if (classToCheck === "_axisMajor"){
                                    $(this).css("background-color", "#000000");
                                    $(this).find("._YearMajor").show();
                                }

                                //right side remove the class
                                $(this).removeClass("_axis-hidden-right");
                            }
                        }
                    });
                };

                var whicheventfunc = function(which) {
                    var whichevent = curr_event.substr(curr_event.indexOf("-")+1,curr_event.length);
                    var titleOrNah;
                    if(which==="left") {
                        if(whichevent === "title") {
                            curr_event = curr_event;
                            titleOrNah = "title";
                        }
                        else if(whichevent === "0" || whichevent === 0) {
                            curr_event = curr_event.substr(0,curr_event.indexOf("-")+1) + "title";
                            if(curr_event === "_event-title") {
                                titleOrNah = "title";
                            }
                            else {
                                titleOrNah = "not";
                            }
                        }
                        else {
                            whichevent = parseInt(whichevent) - 1;
                            curr_event = curr_event.substr(0,curr_event.indexOf("-")+1) + whichevent;
                            titleOrNah = "not";
                        }
                    }
                    else if(which==="right") {
                        if(whichevent === "title") {
                            curr_event = curr_event.substr(0,curr_event.indexOf("-")+1) + 0;
                        }
                        else if(whichevent >= $("._event").length+1) {
                            curr_event = curr_event;
                        }
                        else {
                            whichevent = parseInt(whichevent) + 1;
                            curr_event = curr_event.substr(0,curr_event.indexOf("-")+1) + whichevent;
                        }
                        titleOrNah = "not";
                    }
                    setEvent(curr_event, curr_color, titleOrNah, durationOfFadeAnimations , durationOfChangeEventAnimations);
                };


                //resets everything that needs to have a color changed when a different side is chosen
                var setEverythingToColors = function(color, notInit, event, duration) {
                    animationHappening = true;

                    var colorShadow = "5px 5px 5px " + color[2];

                    setTimeout(function(){
                        if(notInit === "change") {
                            $( "._inner-info-container."+event).fadeIn(duration);
                        }
                        $( "._more-opaque-color" ).animate({
                                backgroundColor: color[0],
                        }, duration);
                        $( "._opaque-color" ).animate({
                                backgroundColor: color[1],
                        }, duration);

                        $( "._solid-bgcolor" ).animate({
                                backgroundColor: color[3]
                        }, duration);

                        $( "._solid-color" ).animate({
                                color: color[3]
                        }, duration);

                        animationHappening = false;
                    }, duration);

                    //title circle
                    $("._active").css("color", color[3]);
                    //event circles
                    $("._event._active").css("background-color", color[3]);

                    //box shadows for inner square
                    $("._shade-color").css("-moz-box-shadow",colorShadow).css("-webkit-box-shadow",colorShadow).css("box-shadow",colorShadow);
                };


                //sets the proper event card in the middle of the embed
                var setEventInfo = function(event, color, which, currSelector, durationOfChangeEventAnimations, leftOrRight) {
                    if(which != "start") {
                        if(leftOrRight === "left") {
                            //starts animation for active event to fade out
                            $("._active-event").addClass("_animated-out-left").removeClass("_active-event");

                            //shows correct event and adds active class
                            setTimeout(function(){
                                $("._animated-out-left").removeClass("_animated-out-left").hide();
                                $("div."+event+"._inner-info-container").addClass("_active-event _animated-in-left").css("translateX","120%");


                                setTimeout(function() {
                                    $("._animated-in-left").removeClass("_animated-in-left");
                                }, durationOfChangeEventAnimations);
                            }, durationOfChangeEventAnimations);
                        }
                        else {
                            //starts animation for active event to fade out
                            $("._active-event").addClass("_animated-in-right").removeClass("_active-event");

                            //shows correct event and adds active class
                            setTimeout(function(){
                                $("._animated-in-right").removeClass("_animated-in-right").hide();
                                $("div."+event+"._inner-info-container").addClass("_active-event _animated-out-right").css("translateX","120%");


                                setTimeout(function() {
                                    $("._animated-out-right").removeClass("_animated-out-right");
                                }, durationOfChangeEventAnimations);
                            }, durationOfChangeEventAnimations);
                        }
                    }
                    else {
                        $("div."+event+"._inner-info-container").addClass("_active-event").show();
                    }
                }

                //sets the proper event bubbles on the timeline
                var setEventBubble = function(event, color, which, currSelector, duration) {
                    if(statusOfTimeline === "collapsed") {
                        expandTimeline();
                    }

                    //if current event is not the title slide then make the title bubble black
                    if(which === "not") {
                        $(".title-icon,.title-icon-after").css("color","#000000");
                    }

                    //if event to go to hasn't already been clicked
                    //adjust the previous active event for animation
                    //then remove the active class
                    if(!$(currSelector).hasClass("_clicked")) {
                        //sets all events that weren't selected to be black
                        $("div:not(."+event+")._event").css("background-color","#000000");


                       //if what needs to be set is not title or start
                        if(which === "not") {
                            makeEventActive(which, curr_color, currSelector,"change", event, duration);
                        }

                        //if what needs to be set is the title screen
                        else if(which === "title") {
                            makeEventActive(which, curr_color, ".title-icon","change", event, duration);
                        }

                        //if what needs to be set is in the beginning of the app
                        else if(which === "start") {
                            $(".title-icon").addClass("_active _clicked");
                            $(".title-icon-after").addClass("_active _clicked");
                            if(!animationHappening) {
                                setEverythingToColors(curr_color, "start", event, duration);
                            }
                        }

                    }
                }


                //utilizes multiple functions to properly set the event that needs to be set
                var setEvent = function(event, color, which, durationOfFadeAnimations, durationOfChangeEventAnimations) {
                    var currSelector = "div."+event+"._event";

                    if(which != "start") {
                        console.log(event);

                        var newEvent = event.substr(event.search("-")+1,event.length);
                        var prevEventPre = $("._active-event").attr("class").split(' ')[1];
                        var prevEvent = prevEventPre.substr(prevEventPre.search("-")+1,prevEventPre.length);

                        console.log(newEvent);
                        console.log(prevEvent);
                        if((prevEvent === "title" && newEvent != "title") || (parseInt(newEvent) > parseInt(prevEvent))) {
                            setEventInfo(event, color, which, currSelector, durationOfChangeEventAnimations, "left");
                            setEventBubble(event, color, which, currSelector, durationOfFadeAnimations);
                        }
                        else if((newEvent === "title" && prevEvent != "title") || (parseInt(newEvent) < parseInt(prevEvent))) {
                            setEventInfo(event, color, which, currSelector, durationOfChangeEventAnimations, "right");
                            setEventBubble(event, color, which, currSelector, durationOfFadeAnimations);
                        }
                    }
                    else {
                        setEventInfo(event, color, which, currSelector, durationOfChangeEventAnimations, "left");
                        setEventBubble(event, color, which, currSelector, durationOfFadeAnimations);
                    }
                };


                //takes in number of side, hides the other side and shows the current one
                var hideSides = function(side) {
                    $("div:not(.opinion-container-side"+side+").opinion").hide();
                    $("div.opinion-container-side" + side + ".opinion").show();
                };

                //initializations for the app to begin
                var curr_side = 0;
                var curr_color = colors[curr_side];
                var curr_event = "_event-title";
                var didItGo = false;



                //expands all elements of the timeline that are hidden
                var expandTimeline = function() {
                    $("._start_minimized._active-event").show();
                    $("._start_minimized._different-sides").show();
                    $("._start_expanded").hide();
                    $("._start_minimized._minusControl").show();

                    statusOfTimeline = "expanded";
                }

                //closes all elements of the timeline that should be hidden
                var collapseTimeline = function() {
                    $("._start_minimized").hide();
                    $("._start_expanded").show();

                    statusOfTimeline = "collapsed";
                }

                //sets up app to start off properly
                if(!didItGo) {
                    //sets event to be the title slide
                    setEvent(curr_event, curr_color, "start", durationOfFadeAnimations , durationOfChangeEventAnimations);

                    //hides the second opinion on initial start of app
                    hideSides(curr_side);

                    //hides all elements on the axis that are below or above the threshold
                    hide_axis("_event", 200, "start");
                    hide_axis("_axisMinor", 200, "start");
                    hide_axis("_axisMajor", 200, "start");

                    //set the keys for different sides based on the colors provided in data
                    setKeyColors(colors[0][3], colors[0][2], colors[1][3], colors[1][2]);
                    $("._key-color1").addClass("_active-color");

                    //hides elements that can save space right after load
                    collapseTimeline();

                    //tells app that it is done setting up
                    didItGo = true;
                }

                //if plus or minus control is clicked, expand or collapse accordingly
                $("._minusControl, ._expandControl").click(function() {
                    if(statusOfTimeline === "collapsed") {
                        expandTimeline();
                    }
                    else if(statusOfTimeline === "expanded") {
                        collapseTimeline();
                    }
                });

                //if the legend is clicked
                $('div[class ^= _side]').click(function() {
                    curr_side = this.classList[0][5];
                    var event = $("._active-event").attr('class').split(" ")[1];
                    var duration = 500;

                    if(!$("._key-color"+curr_side).hasClass("_active-color")) {
                        $("._key-color"+curr_side).addClass("_active-color");
                        curr_color = colors[curr_side-1];
                        if(!animationHappening) {
                            setEverythingToColors(curr_color, "change", event, duration);
                        }
                        hideSides(curr_side - 1);
                        if(curr_side==="1") {
                            curr_side = "2";
                        }
                        else {
                            curr_side = "1";
                        }
                        $("._key-color"+curr_side).removeClass("_active-color");
                    }
                    else {
                        $( "._inner-info-container." +event).effect("shake",{distance: 8},duration/2);
                    }
                });

                //if the title icon is clicked
                $('.title-icon').click(function() {
                    curr_event = this.classList[1];
                    setEvent(curr_event, curr_color, "title", durationOfFadeAnimations , durationOfChangeEventAnimations);
                });


                //if one of the circles on the timeline are clicked
                $('div._event').click(function() {
                    //changes current event to one that was clicked on
                    curr_event = this.classList[1];
                    setEvent(curr_event, curr_color, "not", durationOfFadeAnimations , durationOfChangeEventAnimations);
                });

                //right button clicked
                $('._right-control').click(function() {
                    whicheventfunc("right");
                });

                //left button clicked
                $('._left-control').click(function() {
                    whicheventfunc("left");
                });

                $( "#_axis" ).draggable({ axis: "x", scroll:false});



                //if window is getting resized update which axis should be hidden
                $( window ).resize(function() {
                    hide_axis("_event", 100, "update");
                    hide_axis("_axisMinor", 100, "update");
                    hide_axis("_axisMajor", 100, "update");
                });

                //Checks left property about twice per second
                var watched = $("#_axis");
                var lastDisplay = watched.css("left");
                setInterval(function(){
                  var curDisplay = watched.css("left");

                  if (curDisplay!=lastDisplay){
                    hide_axis("_event", 100, "update");
                    hide_axis("_axisMinor", 100, "update");
                    hide_axis("_axisMajor", 100, "update");
                    lastDisplay = curDisplay;
                  }
                },200);
            }
          });
      }, 500);
    },
    getColors: function(side1Col, side2Col) {
        return [
            [this.hexToRgbA(side1Col,0.4),this.hexToRgbA(side1Col,0.8),this.shadeColor(side1Col,-50),side1Col],
            [this.hexToRgbA(side2Col,0.4),this.hexToRgbA(side2Col,0.8),this.shadeColor(side2Col,-50),side2Col]
        ];
    },


      //have to error check
      //found @http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors#answer-13542669
    shadeColor: function(color, percent) {

        var R = parseInt(color.substring(1,3),16);
        var G = parseInt(color.substring(3,5),16);
        var B = parseInt(color.substring(5,7),16);

        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);

        R = (R<255)?R:255;
        G = (G<255)?G:255;
        B = (B<255)?B:255;

        var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
        var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
        var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

        return "#"+RR+GG+BB;
    },
      //function found @http://stackoverflow.com/questions/21646738/convert-hex-to-rgba#answer-21648508
    //slight modification to add opacity
    hexToRgbA: function(hex, opa){
        var c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
            c= hex.substring(1).split('');
            if(c.length== 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+opa+')';
        }
        throw new Error('Bad Hex');
    },
    cleanUpValues: function(funcData, err, data) {

        //console.log(funcData);
        //console.log(data);

        for(var key in data) {
            var nameOfFirstLevel = key;
            var first = data[key];
            for(var key2 in first) {
                var success = [[],[],[]];

                var nameOfSecondLevel = key2;
                var secondData = first[key2];
                var sizeOfProperFirstLevelArr = first.length;
                var sizeOfProperSecondLevelArr = secondData.length;
                var arrayFirstLevel = funcData[nameOfFirstLevel];
                var thirdData = secondData;
                var sizeOfThirdLevel = thirdData.length;

                if(nameOfFirstLevel === "events") {
                    for(var m=0;m<Object.keys(arrayFirstLevel).length;m++) {
                        var event = arrayFirstLevel[m];
                        var sizeOfCurrentSecondLevelArr = Object.keys(event[nameOfSecondLevel]).length;
                        var currentSecondLevelExists = Object.keys(event[nameOfSecondLevel]);

                        if(sizeOfCurrentSecondLevelArr < sizeOfProperSecondLevelArr) {
                           for(var s=0;s<sizeOfThirdLevel;s++) {
                                var curr = thirdData[s];
                                for(var r=0;r<currentSecondLevelExists.length;r++) {
                                    if(curr != currentSecondLevelExists[r]) {
                                        success[0].push(curr);
                                        success[1].push(s);
                                        success[2].push(m);
                                    }
                                }
                            }
                        }
                    }
                }
                else if(nameOfFirstLevel === "title") {
                    if(nameOfSecondLevel != "sides") {
                        var sizeOfCurrentSecondLevelArr = Object.keys(arrayFirstLevel[nameOfSecondLevel]).length;
                        var currentSecondLevelExists = Object.keys(arrayFirstLevel[nameOfSecondLevel]);

                        if(sizeOfCurrentSecondLevelArr < sizeOfProperSecondLevelArr) {
                           for(var s=0;s<sizeOfThirdLevel;s++) {
                                var curr = thirdData[s];
                                for(var r=0;r<currentSecondLevelExists.length;r++) {
                                    if(curr != currentSecondLevelExists[r]) {
                                        success[0].push(curr);
                                        success[1].push(s);
                                        success[2].push(m);
                                    }
                                }
                            }
                        }
                    }
                    else {
                        for(var y=0;y<2;y++) {
                            nameOfSecondLevel = key2;
                            secondData = first[key2];
                            sizeOfProperFirstLevelArr = first.length;
                            sizeOfProperSecondLevelArr = secondData.length;
                            arrayFirstLevel = funcData[nameOfFirstLevel];
                            thirdData = secondData;
                            sizeOfThirdLevel = thirdData.length;

                            var currSide = Object.keys(arrayFirstLevel[nameOfSecondLevel])[y];

                            currentSecondLevelExists = Object.keys(arrayFirstLevel[nameOfSecondLevel][currSide]);
                            sizeOfCurrentSecondLevelArr = currentSecondLevelExists.length;
                            sizeOfProperSecondLevelArr = secondData.length;

                            if(sizeOfCurrentSecondLevelArr < sizeOfProperSecondLevelArr) {

                                sizeOfThirdLevel = thirdData.length;


                               for(var s=0;s<sizeOfThirdLevel;s++) {
                                    var curr = thirdData[s];
                                    if(currentSecondLevelExists.indexOf(curr) === -1) {
                                        success[0].push(curr);
                                        success[1].push(s);
                                        success[2].push(y);
                                    }
                                }
                            }
                        }
                    }
                }
                for(var h=0;h<success[0].length;h++) {
                    if(nameOfSecondLevel != "sides") {
                        if(success[0][h] === "day" || success[0][h] === "month") {
                            funcData[nameOfFirstLevel][success[2][h]][nameOfSecondLevel][success[0][h]] = "00";
                        }
                        else {
                            funcData[nameOfFirstLevel][success[2][h]][nameOfSecondLevel][success[0][h]] = "";
                        }
                    }
                    else {
                        var arrayForSides = Object.keys(funcData[nameOfFirstLevel][nameOfSecondLevel]);
                        funcData[nameOfFirstLevel][nameOfSecondLevel]["Side" + (success[2][h] + 1)][success[0][h]] = "";
                    }
                }
            }
        }
        return funcData;
    },
    checkIfGoogleDoc: function(url, err) {
        var strCheck = "https://docs.google.com/spreadsheets/";

        if(url.length > strCheck.length) {
            if(url.substr(0,strCheck.length) === strCheck) {
                if(err) {
                    console.log("url is google spreadsheet");
                }
                return true;
            }
            else {
                if(err) {
                    console.log("url is not google spreadsheet");
                }
                return false;
            }
        }
        else {
            if(err) {
                console.log("url is not google spreadsheet");
            }
            return false;
        }
    },

    parseGoogleDoc: function(url, err, sideInfo) {
        var gss = new GoogleSpreadsheetsParser(url, {hasTitle: true});
        var amtOfSides = gss.titles.length - 11;
        var amtOfEvents = gss.contents.length - 1;

        var newJson = this.establishProperStructure(amtOfSides, amtOfEvents);

        if(err) {
            console.log("New Json");
            console.log(newJson);
            console.log(gss);
        }

        for(var col = 0;col<gss.contents.length;col++) {
            var currRow = gss.contents[col];

            //console.log(currRow);
            if(col===0) {
                newJson.title.media.url = currRow[8];
                newJson.title.media.caption = currRow[10];
                newJson.title.media.credit = currRow[9];

                newJson.title.text.headline = currRow[6];
                newJson.title.text.text = currRow[7];

                for(var h=0;h<amtOfSides;h++) {
                    newJson.title.sides["side" + h].name = sideInfo[h][0];
                    newJson.title.sides["side" + h].color = sideInfo[h][1];
                    newJson.title.sides["side" + h].description = sideInfo[h][2];
                }
            }
            else {
                newJson.events[col-1].start_date.year = currRow[0];
                newJson.events[col-1].start_date.month = currRow[1];
                newJson.events[col-1].start_date.day = currRow[2];

                newJson.events[col-1].media.url = currRow[8];
                newJson.events[col-1].media.credit = currRow[10];
                newJson.events[col-1].media.caption = currRow[9];

                newJson.events[col-1].text.headline = currRow[6];
                newJson.events[col-1].text.facts = currRow[7];

                for(var y=0;y<amtOfSides;y++) {
                    var whichSide = 11+y;
                    newJson.events[col-1].text.sides["side" + y] = currRow[whichSide];
                }
            }
        }

        return newJson;
    },

    //goes and fetches data from a url provided
   getJSON: function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("get", url, true);
        xhr.responseType = "json";
        xhr.setRequestHeader('Access-Control-Allow-Origin', window.location.href );

        xhr.onload = function() {
          var status = xhr.status;
          if (status == 200) {
            callback(null, xhr.response);
          } else {
            callback(status);
          }
        };
        xhr.send();
    },


    //checks if text is valid url
    ValidUrL: function(str, err) {
        var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
        if(!regex.test(str)) {
            if(err) {
                console.log("Url is not found within string");
            }
            return false;
        } else {
            if(err) {
                console.log("Url is found within string");
            }
            return true;
        }
    },

    checkIfJsonValid: function(text,err) {
        if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
        replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
        replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
            if(err) {
                console.log("Json is valid");
            }
            return true;
        }
        if(err) {
            console.log("Json is not valid");
        }
        return false;
    },


    //rounds to the nearest number passed into the function
    getNearest: function(upOrDown, roundNum, num) {
        if(upOrDown === "Down") {
            return (num - (num % roundNum));
        }
        else if (upOrDown === "Up"){
            return ((num - (num % roundNum))+roundNum);
        }
    },


    //sets up json structure in line with the json that is used throughout the project
    establishProperStructure: function(numSides, numEvents) {
        var jsonFormat = {};
        jsonFormat.events = {};


        //establishes proper events object
        for(var i=0;i<numEvents;i++) {
            jsonFormat.events[i] = {};

            jsonFormat.events[i].media = {};
            jsonFormat.events[i].start_date = {};
            jsonFormat.events[i].text = {};

            jsonFormat.events[i].media.url = {};
            jsonFormat.events[i].media.credit = {};
            jsonFormat.events[i].media.caption = {};

            jsonFormat.events[i].start_date.year = {};
            jsonFormat.events[i].start_date.month = {};
            jsonFormat.events[i].start_date.day = {};

            jsonFormat.events[i].text.facts = {};
            jsonFormat.events[i].text.headline = {};

            jsonFormat.events[i].text.sides = {};
            for(var y=0;y<numSides;y++) {
                jsonFormat.events[i].text.sides["side" + y] = {};
            }
        }

        //establishes proper title object
        jsonFormat.title = {};

        jsonFormat.title.media = {};
        jsonFormat.title.sides = {};
        jsonFormat.title.text = {};

        jsonFormat.title.media.caption = {};
        jsonFormat.title.media.credit = {};
        jsonFormat.title.media.url = {};

        for(var w=0;w<numSides;w++) {
            jsonFormat.title.sides["side" + w] = {};

            jsonFormat.title.sides["side" + w].name = {};
            jsonFormat.title.sides["side" + w].description = {};
            jsonFormat.title.sides["side" + w].color = {};
        }

        jsonFormat.title.text.headline = {};
        jsonFormat.title.text.text = {};


        return jsonFormat;
    },

    getAllEvents: function(eventObj, range, howFarTicksApart) {
        var allEvents = [];
        var events = [];
        var sides = [];
        var numEvents;

        if(typeof(eventObj) === 'object') {
            numEvents = Object.keys(eventObj).length;
        }
        else {
            numEvents = eventObj.length
        }
        for(var i=0;i<numEvents;i++) {
            var currEvent = [];
            currEvent.push(eventObj[i].media);
            currEvent.push(eventObj[i].start_date);
            currEvent.push(eventObj[i].text);

            sides.push(eventObj[i].text.sides);

            var yearDifference = eventObj[i].start_date.year - range[2];
            var offset;


            if(yearDifference % 5 === 0) {
                offset = ((10*howFarTicksApart)-7) + 2.5;
            }
            else {
                offset = (10*howFarTicksApart)-7;
            }

            var ticksAfterMin = (yearDifference * howFarTicksApart)+offset;
            currEvent.push(ticksAfterMin);
            events.push(currEvent);
        }
        allEvents.push(events);
        allEvents.push(sides);

        return allEvents;
    },


    //makes the labels for the timeline axis
    createTimelineTicks: function(range) {
        var timelineTicks = [];
        for(var y=range[2]-5;y<range[3]+5;y+=5) {
            var timelineLabels = [];
            timelineLabels.push(y);
            timelineLabels.push((y+1).toString().substring(2,4));
            timelineLabels.push((y+2).toString().substring(2,4));
            timelineLabels.push((y+3).toString().substring(2,4));
            timelineLabels.push((y+4).toString().substring(2,4));
            timelineTicks.push(timelineLabels);
        }
        return timelineTicks;
    },


    //reformats all of the dates using moment
    reformatAllDates: function (eventObj) {
        var numEvents;

        if(typeof(eventObj) === 'object') {
            numEvents = Object.keys(eventObj).length;
        }
        else {
            numEvents = eventObj.length;
        }

        var dates = [];
        for(var j=0;j<numEvents;j++) {
            var formatted_date;

            var day = eventObj[j].start_date.day;
            var month = eventObj[j].start_date.month;
            var year = eventObj[j].start_date.year;

            var date = year;
            var perfect_date = "y";

            if(month == null || !Number.isInteger(parseInt(month))) {
            }
            else if(month === "00") {
                date += "/01";
                perfect_date += "m";
            }
            else if(month < 10 && month != "00") {
                date += "/0" + month;
                perfect_date += "m";
            }
            else {
                date += "/" + month;
                perfect_date += "m";
            }


            if(day == null || !Number.isInteger(parseInt(day))) {
            }
            else if(day === "00") {
                date += "/01";
                perfect_date += "d";
            }
            else if(day < 10 && day != "00") {
                date += "/0" + day;
                perfect_date += "d";
            }
            else {
                date += "/" + day;
                perfect_date += "d";
            }

            if(perfect_date === "ymd") {
                formatted_date = moment(new Date(date), moment.ISO_8601).format("dddd, MMMM Do YYYY");
            }
            else if(perfect_date === "ym") {
                formatted_date = moment(new Date(date), moment.ISO_8601).format("MMMM, YYYY");
            }
            else {
                formatted_date = year;
            }

            dates.push(formatted_date);
        }
        return dates;
    },


    //gets min and max date of entire timeline
    getMinAndMax: function(arr, err) {
        var dates=[];
        var minandmax=[];

        for (var key in arr) {
            var currDate;
            //makes sure year is integer otherwise something is wrong
            if(Number.isInteger(parseInt(arr[key].start_date.year))) {
                currDate = parseInt(arr[key].start_date.year);
            }
            else {
                alert("bad error, year doesn't work");
                currDate = "0000";
            }
            //makes sure month is valid integer
            if(Number.isInteger(parseInt(arr[key].start_date.month))) {
                var currMonth = parseInt(arr[key].start_date.month);
                if(currMonth < 10 && currMonth.length<2) {
                    currDate += "/0" + currMonth;
                }
                else {
                    currDate += "/" + currMonth;
                }
            }
            else {
                if(err) {
                    console.log("Something wrong with month");
                }
                currDate += "/01";
            }

            //makes sure day is valid integer
            if(Number.isInteger(parseInt(arr[key].start_date.day))) {
                var currDay = parseInt(arr[key].start_date.day);
                if(currDay < 10  && currDay.length < 2) {
                    currDate += "/0" + currDay;
                }
                else {
                    currDate += "/" + currDay;
                }
            }
            else {
                if(err) {
                    console.log("Something wrong with day");
                }

                currDate += "/01";
            }
            dates.push(new Date(currDate))

            if(err) {
                console.log("Current Date: " + currDate);
            }
        }



        minandmax.push(moment(new Date(Math.min.apply(null,dates)), moment.ISO_8601).format("dddd, MMMM Do YYYY"));
        minandmax.push(moment(new Date(Math.max.apply(null,dates)), moment.ISO_8601).format("dddd, MMMM Do YYYY"));

        var currNum = parseInt(moment(new Date(Math.min.apply(null,dates)), moment.ISO_8601).format("YYYY"));


        //console.log(parseInt(moment(new Date(Math.min.apply(null,dates)), moment.ISO_8601).format("YYYY")));
        //console.log(this.getNearest("Down",5,currNum));
        //console.log(this.getNearest("Up",5,currNum));

        minandmax.push(this.getNearest("Down",5,parseInt(moment(new Date(Math.min.apply(null,dates)), moment.ISO_8601).format("YYYY"))));

        minandmax.push(this.getNearest("Up",5,parseInt(moment(new Date(Math.max.apply(null,dates)), moment.ISO_8601).format("YYYY"))));

        if(err) {
            console.log(dates);
            console.log("Min Date: " + minandmax[0]);
            console.log("Max Date: " + minandmax[1]);
            console.log("Min Date just year: " + minandmax[2]);
            console.log("Max Date just year: " + minandmax[3]);
        }
        return minandmax;
    }
  };

  return app;

});
