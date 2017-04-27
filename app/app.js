define(['jquery', 'ractive', 'rv!templates/template', 'text!css/my-widget_embed.css','moment', 'jqueryUi','jquerytouch'], function ($, Ractive, template, css, moment, autocomplete) {

  'use strict';

  var app = {
    init: function () {
        document.getElementById('omnistory-widget')

        var $style = $("<style></style>", {type: "text/css"});
        var width = document.getElementById('omnistory-widget').getAttribute('width');
        var height = document.getElementById('omnistory-widget').getAttribute('height');
        var jsonData = document.getElementById('omnistory-widget').getAttribute('data');
        //var authName = document.getElementById('omnistory-widget').getAttribute('AuthorName');
        //var authEmail = document.getElementById('omnistory-widget').getAttribute('AuthorEmail');
        var Stakeholder_Names, Stakeholder_Colors, Stakeholder_Descriptions;

        if(document.getElementById("omnistory-widget").getAttribute('preview') === "false") {
            Stakeholder_Names = JSON.parse(document.getElementById('omnistory-widget').getAttribute('Stakeholder_Names'));
            Stakeholder_Colors = JSON.parse(document.getElementById('omnistory-widget').getAttribute('Stakeholder_Colors'));
            Stakeholder_Descriptions = JSON.parse(document.getElementById('omnistory-widget').getAttribute('Stakeholder_Descriptions'));
        }
        else {
            Stakeholder_Names = JSON.parse(decodeURI(document.getElementById('omnistory-widget').getAttribute('Stakeholder_Names')));
            Stakeholder_Colors = JSON.parse(decodeURI(document.getElementById('omnistory-widget').getAttribute('Stakeholder_Colors')));
            Stakeholder_Descriptions = JSON.parse(decodeURI(document.getElementById('omnistory-widget').getAttribute('Stakeholder_Descriptions')));
        }

        var errorChecking = false;
        var json = [];
        var dateRange;
        var amtSides;
        var amtEvents;
        var paddingForImages = 5;
        //swipe on mobile instead of carets

        //denotes space between the major axis'
        var spaceBetweenMajors = 150;

        //adjusts speed of the animation
        var durationOfFadeAnimations = 350;
        var durationOfChangeEventAnimations = durationOfFadeAnimations + 50;
        var changeAnimationInCSS = this.round(((durationOfFadeAnimations * 0.5)/349),2);
        var durationOfShake = 500;

        //controls size of the event bubble and the container for it when there is a container for the same year
        var sizeOfEventBubble = 20;
        var eventSameYearPadding = 15;
        var offset = 6;

        //enables entire application to either start collapsed or opened
        var startCollapsed = true;

        //controls the fade out of the timeline axis pieces
        var durationOfFade = 100;

        //three main inputs of data are through json and by a link that returns json, and lastly google spreadsheet with specific format
        //if json is valid
        //if it is parses it
        if(this.checkIfGoogleDoc(jsonData, errorChecking)){
            json = this.parseGoogleDoc(jsonData, errorChecking, Stakeholder_Names, Stakeholder_Colors, Stakeholder_Descriptions);
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



        amtSides = Object.keys(json.title.sides).length;
        amtEvents = Object.keys(json.events).length;

        //gets min and max range for timeline scale
        var dateRange = this.getMinAndMax(json.events, errorChecking);

        //any variables not given in json are turned into empty strings

        //creates object of all events
        var allEvents = this.getAllEvents(json.events, dateRange, spaceBetweenMajors/5);

        //reformats all the dates to be a better format
        allEvents.push(this.reformatAllDates(allEvents[0]));

        //gets all the colors necessary for styling everything
        //first number is which side to choose, second is which color
        //ex [0][0] => first side's opaque color
        var colors = this.getColors(amtSides, json.title.sides);

        //creates timeline axis
        var timelineTicks = this.createTimelineTicks(dateRange);

        //adds css to page
        $style.text(css);
        $("head").append($style);

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
                  date_array: allEvents[2],
                  timelineTicks: timelineTicks,
                  allEvents: allEvents[0]
                },
                oncomplete: function(){
                    //checks to see if there is text that got highlighted
                        var getSelectedText = function() {
                            var text = "";



                            if (typeof window.getSelection != "undefined") {
                                text = window.getSelection().toString();
                            } else if (typeof document.selection != "undefined" && document.selection.type == "Text") {
                                text = document.selection.createRange().text;
                            }
                            return text;
                        }

                        var doSomethingWithSelectedText = function() {
                            var paddingForTextIcon = 20;
                            $("._text_selection").remove();
                            var selectedText = getSelectedText();
                            if (selectedText) {
                                var range = window.getSelection().getRangeAt(0);
                                var dummy = document.createElement("span");
                                dummy.className = "_text_selection";
                                range.insertNode(dummy);
                                var x = $("._text_selection").offset().left + $("._text_selection").width() + paddingForTextIcon;
                                var y = $("._text_selection").offset().top + $("._text_selection").height();
                                $("._text_selection").html("<i class='fa fa-comment' aria-hidden='true' style='font-size:1em;background-color: rgba(0,0,0,0.4);padding: 5px 10px;position:absolute;left:"+x+"px;top:"+y+"px;'></i>");
                                console.log("Left: " + x);
                                console.log("Top: " + y);

                                console.log("Text happened");
                                console.log(selectedText);
                                //console.log("Range");
                                //console.log("X: " + x + " Y: " + y);
                            }
                        }

                        //document.onmouseup = doSomethingWithSelectedText;
                        //document.onkeyup = doSomethingWithSelectedText;


                    //determines whether or not a mouse is present
                        var hasMouse = false;

                        window.onmousemove = function() {
                            hasMouse = true;
                        }

                        var setNewPositionOfAxis = function(newEvent, durationOfAnimation) {
                            newEvent = "._event-" + newEvent;

                            var newLeft,changeToClicked=false, newAxisLeftPos,offset,currPosAxis;

                            currPosAxis = parseInt($("._axis.ui-draggable.ui-draggable-handle").css("left").substring(0,$("._axis.ui-draggable.ui-draggable-handle").css("left").length-2));

                            //gets new event position
                            newLeft = $(newEvent).data('left_pos');

                            //if event is title then just reset axis to 0
                            //otherwise find new axis position based on new event
                            if(newEvent === "._event-title") {
                                newAxisLeftPos = (0 - spaceBetweenMajors);
                            }
                            else {
                                newAxisLeftPos = (newLeft - spaceBetweenMajors)*-1;
                            }

                            $("#_axis").animate({"left":newAxisLeftPos}, durationOfAnimation);
                        }

                    //finds largest inner info container and sets the minheight to be that height (for the fact that its going to be within a page)
                    var findAndSetLargestHeight = function() {
                        var largestHeight = 0;
                        $("._inner-info-container").each(function() {
                            var currHeight = $(this).height();
                            if(currHeight > largestHeight) {
                                largestHeight = currHeight;
                            }
                        });
                        $("._content-container-omnistory._expanded").css("min-height",largestHeight+250);
                    }
                    var curr_side = 0;
                    var curr_color = colors[curr_side];
                    var curr_event = "_event-title";
                    var didItGo = false;
                    var eventChanging = false;

                    //tracks if timeline is open or closed
                    var statusOfTimeline;

                    //checks whether animation is currently happening
                    var animationHappening = false;

                    //goes through all major and minor axis' and makes their positioning right
                    var n = 1;
                    $("._axisMajor").each(function() {
                        var currLeftPost = n*spaceBetweenMajors;
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

                    var placeEventsOnTimeline = function(setEventPositionsArr) {
                        //variable is iterator for all the event bubbles
                        var whichEvent = 0;

                        //variable is iterator for the section arr
                        var whichEventInSection = 0;
                        var whichPieceOfArr = 0;
                        var whichPieceOfEventSections=0;

                        //array determines how many sections and how many events are within all the sections
                        var eventSections = [];

                        $("._eventSection").each(function() {
                            eventSections.push($(this).children().length);
                            var widthOfThisEventSection = ($(this).children().length * sizeOfEventBubble) + (2*eventSameYearPadding);
                            $(this).css({"width":widthOfThisEventSection,"height":"38px"});
                        });

                        var p=0;
                        $("._event").each(function() {
                            if(whichEventInSection >= eventSections[whichPieceOfEventSections]) {
                                whichEventInSection = 0;
                                whichPieceOfArr++;
                                whichPieceOfEventSections++;
                            }
                            //if this current event is a duplicate
                            if($(this).parent().hasClass('_eventSection')) {

                                var leftData = setEventPositionsArr[whichPieceOfArr][0][whichEventInSection][3];
                                $(this).css({"left":leftData}).data('left_pos',leftData);
                                p++;
                                whichEventInSection++;
                            }
                            //else it doesn't have multiple and it can just be done simpler
                            else {
                                var leftData = setEventPositionsArr[whichPieceOfArr][0][3];
                                $(this).css("left",leftData).data('left_pos',leftData);
                                whichPieceOfArr++;
                            }
                            whichEvent++;
                        });
                    }

                    //sets left positioning of all of the events
                    placeEventsOnTimeline(allEvents[0]);

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
                            //checks to see if the upcoming event is in a section of events and if it isn't then it closes but if it is it opens that section
                            if($(makeEventActiveSelector).attr("class").split(' ').indexOf("_event-in-section") > 0 && $(makeEventActiveSelector).attr("class").split(' ').indexOf("_opened-event") < 0) {
                                closeOpenedSameYearContainer();
                                openEventSection(makeEventActiveSelector, sizeOfEventBubble, eventSameYearPadding);
                            }
                            else if($(makeEventActiveSelector).attr("class").split(' ').indexOf("_event-in-section") > 0 && $(makeEventActiveSelector).attr("class").split(' ').indexOf("_opened-event") > 0){
                            }
                            else {
                                closeOpenedSameYearContainer();
                            }

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
                            $(selector).css("left",newLeftPost);
                        }
                        else if(leftOrRight === "right") {
                            var oldLeft = parseInt($(selector).css("left").substr(0,$(selector).css("left").length-2));
                            var newLeftPost = oldLeft + amt;
                            $(selector).css("left",newLeftPost);
                        }
                    }

                    //sets the colors for the keys
                    var setKeyColors = function(colors) {
                        var i=0;
                        $("._key-colors").each(function() {
                            $("._key-colorside" + i).css("background-color", colors[i]);
                            i++;
                        });
                    };


                    var isEventHidden = function(selector) {
                        return ($(selector).hasClass("_axis-hidden-right") || $(selector).hasClass("_axis-hidden-left"))
                    };

                    //hides elements that go beyond certain point to the right and left of the axis
                    var hide_axis = function(classToCheck, startOrNah) {
                        var original_line_left = $("._line").offset().left;
                        var original_line_right = original_line_left + $("._line").width();

                        $("." + classToCheck).each(function() {
                            var offset = $(this).offset();
                            var posLeft;
                            var posRight;

                            if(classToCheck === "_event") {
                                posLeft = offset.left - 58;
                                posRight = offset.left + 63;
                            }
                            else {
                                posLeft = offset.left - 65;
                                posRight = offset.left + 60;
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
                        var textBeforeNum = curr_event.substr(0,curr_event.indexOf("-")+1);
                        var whichevent = curr_event.substr(curr_event.indexOf("-")+1,curr_event.length);
                        var tryingToGoTo;

                        if(which === "left") {
                            if(whichevent == 0) {
                                tryingToGoTo = "title";
                            }
                            else {
                                tryingToGoTo = parseInt(whichevent) - 1;
                            }
                        }
                        else if(which === "right"){
                            if(whichevent === "title") {
                                tryingToGoTo = 0;
                            }
                            else {
                                tryingToGoTo = parseInt(whichevent) + 1;
                            }
                        }
                        if(tryingToGoTo <= amtEvents-1 || tryingToGoTo === "title") {
                            var titleOrNah;
                            if(which==="left") {
                                if(whichevent === "title") {
                                    curr_event = curr_event;
                                    titleOrNah = "title";
                                }
                                else if(whichevent === "0" || whichevent === 0) {
                                    curr_event = textBeforeNum + "title";
                                    if(curr_event === "_event-title") {
                                        titleOrNah = "title";
                                    }
                                    else {
                                        titleOrNah = "not";
                                    }
                                }
                                else {
                                    curr_event = textBeforeNum + tryingToGoTo;
                                    titleOrNah = "not";
                                }
                            }
                            else if(which==="right") {
                                if(whichevent === "title") {
                                    curr_event = textBeforeNum + 0;
                                }
                                else {
                                    curr_event = textBeforeNum + tryingToGoTo;
                                }
                                titleOrNah = "not";
                            }
                            setEvent(curr_event, curr_color, titleOrNah, durationOfFadeAnimations , durationOfChangeEventAnimations);
                        }
                        else {
                            shakeEventSlide();
                        }
                    };


                    //resets everything that needs to have a color changed when a different side is chosen
                    var setEverythingToColors = function(color, notInit, event, duration) {
                        animationHappening = true;

                        var colorShadow = "0px 5px 10px " + color[2];

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


                            $("._font-color, ._font-color2").removeClass("white-text black-text");
                            if(color[4] === "#FFFFFF") {
                                $( "._font-color, ._font-color2" ).addClass("white-text").animate({"color":"#FFFFFF"},1000);
                            }
                            else {
                                $( "._font-color, ._font-color2" ).addClass("black-text").animate({"color":"#000000"},1000);;
                            }

                           $( "._content-container-omnistory" ).animate({
                                    backgroundColor: color[5]
                            }, duration);

                        }, duration);


                        //title circle
                        $("._active").css("color", color[3]);
                        //event circles
                        $( "._event._active" ).animate({
                                "background-color": color[3]
                        }, duration/3);

                        //box shadows for inner square
                        $("._shade-color").css("-moz-box-shadow",colorShadow).css("-webkit-box-shadow",colorShadow).css("box-shadow",colorShadow);

                        setTimeout(function() {
                            animationHappening = false;
                        }, (duration*2)+150)
                    };


                    //sets the proper event card in the middle of the embed
                    var setEventInfo = function(event, color, which, currSelector, durationOfChangeEventAnimations, leftOrRight, newEvent) {
                        //as long as new event exists, which it almost always should, set new position of axis
                        if(newEvent) {
                            setNewPositionOfAxis(newEvent,500);
                        }


                        if(which != "start") {
                            if(leftOrRight === "left") {
                                //starts animation for active event to fade out
                                $("._active-event").addClass("_animated-out-left").removeClass("_active-event");

                                //shows correct event and adds active class
                                setTimeout(function(){
                                    $("._animated-out-left").removeClass("_animated-out-left").hide();
                                    $("div."+event+"._inner-info-container").addClass("_active-event _animated-in-left").css("translateX","120%");


                                    setTimeout(function() {
                                        setCaptionAndImgResize(paddingForImages);
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
                                        setCaptionAndImgResize(paddingForImages);
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
                            var newEvent = event.substr(event.search("-")+1,event.length);
                            var prevEventPre = $("._active-event").attr("class").split(' ')[1];
                            var prevEvent = prevEventPre.substr(prevEventPre.search("-")+1,prevEventPre.length);

                            if((prevEvent === "title" && newEvent != "title") || (parseInt(newEvent) > parseInt(prevEvent))) {
                                setEventInfo(event, color, which, currSelector, durationOfChangeEventAnimations, "left", newEvent);
                                setEventBubble(event, color, which, currSelector, durationOfFadeAnimations);
                            }
                            else if((newEvent === "title" && prevEvent != "title") || (parseInt(newEvent) < parseInt(prevEvent))) {
                                setEventInfo(event, color, which, currSelector, durationOfChangeEventAnimations, "right", newEvent);
                                setEventBubble(event, color, which, currSelector, durationOfFadeAnimations);
                            }
                        }
                        else {
                            setEventInfo(event, color, which, currSelector, durationOfChangeEventAnimations, "left", newEvent);
                            setEventBubble(event, color, which, currSelector, durationOfFadeAnimations);
                        }
                    };

                    //takes in number of side, hides the other side and shows the current one
                    var hideSides = function(side) {
                        $("div:not(.opinion-container-side"+side+").opinion").hide();
                        $("div.opinion-container-side" + side + ".opinion").show();
                    };



                    //expands all elements of the timeline that are hidden
                    var expandTimeline = function() {
                        $("._content-container-omnistory").addClass("_expanded");
                        //figures out min-height (height of largest inner container)
                        findAndSetLargestHeight();

                        setTimeout(function() {
                            $("._slide-img-caption").show();
                        }, 200);

                        $("._expandControl").addClass("_expand-control").removeClass("_collapse-control");


                        $("._start_minimized._active-event").slideDown();
                        $("._start_minimized._different-opinions").slideDown();
                        $("._start_expanded").hide();
                        statusOfTimeline = "expanded";
                    }
                    //closes all elements of the timeline that should be hidden
                    var collapseTimeline = function(which) {
                        $("._content-container-omnistory").removeClass("_expanded").css("min-height",0);

                        setTimeout(function() {
                            $("._slide-img-caption").hide();
                        }, 200);

                        //if its not the initial start, create slide effect otherwise just hide it for the start
                        if(which != "start") {
                            $("._start_minimized").slideUp();
                            $("._expandControl").addClass("_collapse-control").removeClass("_expand-control");
                        }
                        else {
                            $("._start_minimized").hide();
                        }
                        $("._start_expanded").show();

                        statusOfTimeline = "collapsed";
                    }

                    function hasTouch() {
                        return (('ontouchstart' in window) ||       // html5 browsers
                                (navigator.maxTouchPoints > 0) ||   // future IE
                                (navigator.msMaxTouchPoints > 0));  // current IE10
                    }

                    /* code based on http://stackoverflow.com/questions/30074246/how-to-create-ripple-effect-on-click-material-design*/
                    var clickAnimation = function(that, e, which) {
                        // Remove any old one
                          $(".ripple").remove();

                          // Setup
                          var posX = $(that).offset().left,
                              posY = $(that).offset().top,
                              buttonWidth = $(that).width(),
                              buttonHeight =  $(that).height();

                        posX = $(that).offset().left + parseInt($(that).css("padding-left").substr(0,$(that).css("padding-left").length -2));
                        posY = $(that).offset().top;

                        if(which === "key") {
                            buttonWidth = $(that).find("._key-colors").width();
                            buttonHeight =  $(that).find("._key-colors").height();
                        }

                         $(that).prepend("<span class='ripple'></span>");

                         // Make it round!
                          if(buttonWidth >= buttonHeight) {
                            buttonHeight = buttonWidth;
                          } else {
                            buttonWidth = buttonHeight;
                          }


                          // Get the center of the element
                          var x;
                          var y;

                            if(which === "key" || which === "notKey") {
                              x = (e.pageX - buttonWidth / 2);
                              y = (e.pageY - buttonHeight / 2);
                            }
                            else {
                                x = (e.pageX - posX) - (buttonWidth / 2);
                                y = (e.pageY - posY) - (buttonHeight / 2);
                            }

                          $(".ripple").css({
                            width: buttonWidth,
                            height: buttonHeight,
                            top: y + 'px',
                            left: x + 'px'
                          }).addClass("rippleEffect");
                        };

                    //goes through all of the image stuff and sets the caption underneath it properly and sets the credit at the bottom of the img
                    var setCaptionAndImgResize = function(padding, which) {
                        var event =  $("._active-event").attr("class").split(" ")[1];
                        var currentImg = $("." + event + " ._slide-img-wrapper").find("._slide-img");
                        var currentCaption = $("." + event + " ._slide-img-wrapper").find("._slide-img-caption");
                        var section_container = $("." + event + " ._slide-img-wrapper").closest("._inner-facts");


                        var newWidth = (section_container.width()*0.2);
                        var sizeOfContainer = section_container.height() + parseInt(section_container.css("padding").substring(0,section_container.css("padding").length-2));

                        if(currentImg.height() > sizeOfContainer) {
                            section_container.height(currentImg.height() + padding);

                        }
                        currentCaption.css({"width":newWidth,"padding":padding});
                    }

                    var shakeEventSlide = function(event) {
                        if(event) {
                            $( "._inner-info-container." +event).effect("shake",{distance: 8},durationOfShake/2);
                        }
                        else {
                            var event = $("._active-event").attr('class').split(" ")[1];
                            $( "._inner-info-container." + event).effect("shake",{distance: 8},durationOfShake/2);
                        }
                    }

                    var animateEvent = function(leftOrRight) {
                        //if event is not currently changing then start the process to change the event
                        if(!eventChanging) {
                            eventChanging = true;
                            whicheventfunc(leftOrRight);
                        }

                        //waits about how long it takes for the change of event plus a little extra
                        setTimeout(function() {
                            eventChanging = false;
                        },(durationOfChangeEventAnimations*2)+150)
                    }

                    //sets up app to start off properly
                    if(!didItGo) {
                        //sets event to be the title slide
                        setEvent(curr_event, curr_color, "start", durationOfFadeAnimations, durationOfChangeEventAnimations);

                        //hides the second opinion on initial start of app
                        hideSides(curr_side);

                        //hides all elements on the axis that are below or above the threshold
                        hide_axis("_event", "start");
                        hide_axis("_axisMinor", "start");
                        hide_axis("_axisMajor", "start");

                        //set the keys for different sides based on the colors provided in data
                        var colorsForKeys = [];
                        for(var i=0;i<amtSides;i++) {
                            colorsForKeys.push(colors[i][3]);
                        }
                        setKeyColors(colorsForKeys);
                        $("._key-color1").addClass("_active-color");

                        //hides elements that can save space right after load
                        if(startCollapsed) {
                            collapseTimeline("start");
                        }

                        //tells app that it is done setting up
                        didItGo = true;
                    }

                    //if plus or minus control is clicked, expand or collapse accordingly
                    $("._expandControl").click(function(e) {
                        var that = this;

                        if(statusOfTimeline === "collapsed") {
                            clickAnimation(that, e, "notKey");
                            expandTimeline();
                        }
                        else if(statusOfTimeline === "expanded") {
                            clickAnimation(that, e, "notKey");
                            collapseTimeline();
                        }
                    });

                    //if the legend is clicked
                    $('div[class ^= _stakeholder]').click(function(e) {
                        var that = this;
                        clickAnimation(that, e, "key");

                        //current side that needs to change
                        curr_side = this.classList[0][17];
                        var event = $("._active-event").attr('class').split(" ")[1];
                        var durationOfColorChange = 500;



                        //check if current key is active
                        var isCurrentKeyActive = $("._key-colorside"+curr_side).attr("class").split(" ")[2] === "_active-color";
                        if(!isCurrentKeyActive) {
                            if(!animationHappening) {
                                $("._key-colorside"+curr_side).addClass("_active-color");
                                curr_color = colors[curr_side];
                                setEverythingToColors(curr_color, "change", event, durationOfColorChange);
                                hideSides(curr_side);
                                $("div:not(._key-colorside"+curr_side+")").removeClass("_active-color");
                            }
                        }
                        else {
                            shakeEventSlide(event);
                        }
                    });

                    //if the title icon is clicked
                    $('.title-icon').click(function() {
                        curr_event = this.classList[1];
                        setEvent(curr_event, curr_color, "title", durationOfFadeAnimations , durationOfChangeEventAnimations);
                    });


                    //if one of the circles on the timeline are clicked
                    $('div._event:not("._event-in-section")').click(function() {
                        //changes current event to one that was clicked on
                        if(this.classList[1] === "_event-in-section") {
                            curr_event = this.classList[2];
                        }
                        else {
                            curr_event = this.classList[1];
                        }

                        //if a container is open with multiple events, close it
                        closeOpenedSameYearContainer();
                        setEvent(curr_event, curr_color, "not", durationOfFadeAnimations , durationOfChangeEventAnimations);
                    });

                    $('div._eventSection ._event._event-in-section:not("._opened-event")').click(function() {
                        var currentClickedClasses = $(this).attr("class").split(' ');
                        if(!currentClickedClasses[3]) {
                            closeOpenedSameYearContainer();
                            //changes current event to one that was clicked on
                            var that = this;
                            openEventSection(that, sizeOfEventBubble, eventSameYearPadding);
                        }
                        else {
                            setEvent(currentClickedClasses[2], curr_color, "not", durationOfFadeAnimations, durationOfChangeEventAnimations);
                        }
                    });

                    var closeOpenedSameYearContainer = function() {
                        if($("._eventSection._clicked")[0]) {

                            $("._eventSection._clicked ._event-in-section").each(function() {
                                var leftForEvents = $(this).data('left_pos');

                                if($(this).attr("class").split(' ').indexOf("_active") > 0) {
                                    leftForEvents = leftForEvents - 2;
                                }
                                $(this).css({"left":leftForEvents}).animate({"top":"0","margin-top":0}, 500).addClass("_closingEverything");
                            });

                                setTimeout(function() {
                                    $("._closingEverything").removeClass("_closingEverything");
                                }, 500);

                            $("._eventSection._clicked").removeClass("_clicked");
                            $("._event-in-section._opened-event").removeClass("_opened-event");
                        }
                    }

                    var openEventSection = function(that, sizeOfEventBubble, eventSameYearPadding) {
                        var whichEvent = 0;

                        var leftForSection = $(that).data('left_pos') - offset;

                        $(that).parent().css({"left":leftForSection,"padding-right":eventSameYearPadding}).addClass("_clicked");

                        $("._eventSection._clicked ._event-in-section").each(function() {
                            var widthOfIndividualEvent = (whichEvent * sizeOfEventBubble)+((eventSameYearPadding) + (5*whichEvent));
                            var marginTop = whichEvent*2.5;

                            $(this).css({"top":offset,"left":widthOfIndividualEvent}).addClass("_opened-event");
                            whichEvent++;
                        });
                    }

                    //controls swiping and hides controls if it is only touch and there isn't a mouse
                    if(hasTouch() && !hasMouse) {
                        $("._right-control, ._left-control").hide();
                        $("._content-container-omnistory").swipe( {
                        //Generic swipe handler for all directions
                            swipe:function(event, direction, distance, duration, fingerCount, fingerData) {
                                if(direction === "right") {
                                    animateEvent("left");
                                }
                                else if (direction === "left"){
                                    animateEvent("right");
                                }
                                else {
                                    //neither left or right was swiped
                                }
                            }
                        });
                    }
                    else {
                        //right button clicked
                        $('._right-control').click(function() {
                            animateEvent("right");
                        });

                        //left button clicked
                        $('._left-control').click(function() {
                            animateEvent("left");
                        });
                    }

                    $( "#_axis" ).draggable({ axis: "x", scroll:false});



                    //if window is getting resized update which axis should be hidden
                    $( window ).resize(function() {
                        hide_axis("_event", "update");
                        hide_axis("_axisMinor", "update");
                        hide_axis("_axisMajor", "update");
                    });

                    //Checks left property about twice per second
                    var watched = $("#_axis");
                    var lastDisplay = watched.css("left");
                    setInterval(function(){
                      var curDisplay = watched.css("left");

                      if (curDisplay!=lastDisplay){
                        hide_axis("_event", "update");
                        hide_axis("_axisMinor", "update");
                        hide_axis("_axisMajor", "update");
                        lastDisplay = curDisplay;
                      }
                    },50);

                    var startingposition = 0 - spaceBetweenMajors;
                    $("._axis.ui-draggable.ui-draggable-handle").css("left",startingposition);
                }
              });
          }, 200);
        },
    getColors: function(amtSides, sidesArr) {
        var colors = [];
        for(var j=0;j<amtSides;j++) {
            var newColors = [];
            var currColor = sidesArr["side" + j].color;
            var infoContainerCol = this.hexToRgbA(currColor,0.4);
            newColors.push(infoContainerCol);
            newColors.push(this.hexToRgbA(currColor,0.8));
            newColors.push(this.shadeColor(currColor,-50));
            newColors.push(currColor);
            newColors.push(this.pickTextColorBasedOnBgColorAdvanced(infoContainerCol, '#E4E4E4', '#000000'));
            newColors.push(this.hexToRgbA(currColor,0.3));
            colors.push(newColors)
        }

        return colors;
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

    checkIfGoogleDoc: function(url, err) {
        var strCheck = "https://docs.google.com/spreadsheets/";

        if(url.length > strCheck.length) {
            if(url.substr(0,strCheck.length) === strCheck) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    },

    parseGoogleDoc: function(publishedURL, err, stakeholderNames, stakeholderColors, stakeholderDescriptions) {
        //finds the google spreadsheet key
            var matched;
            matched = publishedURL.match(/https:\/\/docs.google.com\/spreadsheets\/d\/(.+)\/pubhtml/);
            if (matched === null || matched.length !== 2) {
              return null;
            }
            var sheetKey = matched[1];

        //does a second http request to get the sheet id
            var basicInfo, e, i, matched, ref, url, xhr;
            url = "https://spreadsheets.google.com/feeds/worksheets/" + sheetKey + "/public/basic?alt=json";
            xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.send();
            matched = [];
            if (xhr.status === 200) {
              basicInfo = JSON.parse(xhr.responseText);
                matched = basicInfo.feed.entry[0].id.$t.match(/https:\/\/spreadsheets.google.com\/feeds\/worksheets\/.+\/public\/basic\/(.+)/);
            }
            if (matched === null || matched.length !== 2) {
              return null;
            }
            var sheetId = matched[1];

        //goes through all data and creates json object
            var feeds, xhr;
            var url2 = "https://spreadsheets.google.com/feeds/list/"+sheetKey+"/"+sheetId+"/public/values?alt=json";
            xhr = new XMLHttpRequest();
            xhr.open("GET", url2, false);
            xhr.send();
            feeds = null;
            if (xhr.status === 200) {
              feeds = JSON.parse(xhr.responseText);
            }

            var amtOfEvents = feeds.feed.entry.length-1;
            var amtOfSides = Object.keys(feeds.feed.entry[0]).length-17;
            var newJson = this.establishProperStructure(amtOfSides, amtOfEvents);
            var keys=['year','month','day','endyear','endmonth','endday','headline','text','mediaurl','mediacredit','mediacaption'];
            for(var k=1;k<amtOfSides+1;k++) {
                keys.push('stakeholder'+k);
            }

            for(var col=0;col<feeds.feed.entry.length;col++) {
                var currRow = feeds.feed.entry[col];

                if(col===0) {
                    newJson.title.media.url = currRow['gsx$'+keys[8]]['$t'];
                    newJson.title.media.caption = currRow['gsx$'+keys[10]]['$t'];
                    newJson.title.media.credit = currRow['gsx$'+keys[9]]['$t'];

                    newJson.title.text.headline = currRow['gsx$'+keys[6]]['$t'];
                    newJson.title.text.text = currRow['gsx$'+keys[7]]['$t'];

                    for(var h=0;h<amtOfSides;h++) {
                        var whichSide = 11+h;
                        newJson.title.sides["side" + h].name = stakeholderNames[h];

                        if(stakeholderColors[h].indexOf("#") < 0) {
                            newJson.title.sides["side" + h].color = "#" + stakeholderColors[h];
                        }
                        else {
                            newJson.title.sides["side" + h].color = stakeholderColors[h];
                        }

                        try {
                            newJson.title.sides["side" + h].description = stakeholderDescriptions[h];
                        }
                        catch(err) {
                            newJson.title.sides["side" + h].description = currRow['gsx$'+keys[whichSide]]['$t'];
                        }
                    }
                }
                else {
                    //sets values of the new json to current event
                    //substracts 1 to account for the title slide
                    newJson.events[col-1].start_date.year = currRow['gsx$'+keys[0]]['$t'];
                    newJson.events[col-1].start_date.month = currRow['gsx$'+keys[1]]['$t'];
                    newJson.events[col-1].start_date.day = currRow['gsx$'+keys[2]]['$t'];

                    newJson.events[col-1].media.url = currRow['gsx$'+keys[8]]['$t'];
                    newJson.events[col-1].media.credit = currRow['gsx$'+keys[9]]['$t'];
                    newJson.events[col-1].media.caption = currRow['gsx$'+keys[10]]['$t'];

                    newJson.events[col-1].text.headline = currRow['gsx$'+keys[6]]['$t'];
                    newJson.events[col-1].text.facts = currRow['gsx$'+keys[7]]['$t'];

                    for(var y=0;y<amtOfSides;y++) {
                        var whichSide = 11+y;
                        newJson.events[col-1].text.sides["side" + y] = currRow['gsx$'+keys[whichSide]]['$t'];
                    }
                }
            }
            return newJson;
    },

    makeRequest: function(method, url) {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
          if (this.status >= 200 && this.status < 300) {
            resolve(xhr.response);
          } else {
            reject({
              status: this.status,
              statusText: xhr.statusText
            });
          }
        };
        xhr.onerror = function () {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        };
        xhr.send();
      });
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
            return false;
        } else {
            return true;
        }
    },

    checkIfJsonValid: function(text,err) {
        if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
        replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
        replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
            return true;
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
        var allEventsArr = [];
        var events = [];
        var sides = [];
        var eventCount = 0;

        eventObj = this.checkAllEventsForSameYear(eventObj);
        eventObj = this.sortPropertiesByObj(eventObj,true,false);


        var numEvents = eventObj.length;

        var eventNum = 0;

        for(var i=0;i<numEvents;i++) {
            var tmpArr = []
            var currEvent = [];
            var currSide = [];
            if(eventObj[i][1].length > 1) {
                for(var n=0;n<eventObj[i][1].length;n++) {
                    currSide.push(this.getEventsAndPushToArr(eventObj[i][1][n],range,howFarTicksApart, eventNum));
                    sides.push(this.getSidesAndPushToArr(eventObj[i][1][n],range,howFarTicksApart));
                    eventNum++;
                }
                tmpArr.push(currSide);
            }
            else {
                tmpArr.push(this.getEventsAndPushToArr(eventObj[i][1][0],range,howFarTicksApart, eventNum));
                sides.push(this.getSidesAndPushToArr(eventObj[i][1][0],range,howFarTicksApart));
                eventNum++;
            }
            events.push(tmpArr);
        }
        allEventsArr.push(events);
        allEventsArr.push(sides);

        return allEventsArr;
    },


    getEventsAndPushToArr: function(obj, range, howFarTicksApart, eventCount) {
        var currEvent = [];
        currEvent.push(obj.media);
        currEvent.push(obj.start_date);
        currEvent.push(obj.text);


        var yearDifference = obj.start_date.year - range[2];
        var offset;


        if(yearDifference % 5 === 0) {
            offset = ((10*howFarTicksApart)-7) + 2.5;
        }
        else {
            offset = (10*howFarTicksApart)-7;
        }

        var ticksAfterMin = (yearDifference * howFarTicksApart)+offset;
        currEvent.push(ticksAfterMin);
        currEvent.push(eventCount);
        return currEvent;
    },

    getSidesAndPushToArr: function(obj, range, howFarTicksApart) {
        var sides = [];
        for(var i=0;i<Object.keys(obj.text.sides).length;i++) {
            sides.push(obj.text.sides['side' + i]);
        }
        return sides;
    },

    //goes through all of the events and puts it into a format that can then show duplicate years
    checkAllEventsForSameYear: function(oldEvents) {
        var newEvents = [];
        var yearsWithRepetition = [];
        var allYears = [];

        //turns object into array to be worked with
        oldEvents = Object.keys(oldEvents).map(function (key) { return oldEvents[key]; });

        //figures out which events have duplicates
        for(var i=0;i<Object.keys(oldEvents).length;i++) {
            var currEvent = oldEvents[i]["start_date"]["year"];

            if($.inArray(currEvent, allYears) >= 0) {
                if($.inArray(currEvent, yearsWithRepetition) < 0) {
                    yearsWithRepetition.push(currEvent);
                }
            }
            else {
                allYears.push(currEvent);
            }
        }

        //goes through all the years with duplicates and adds them to final array
        for(var h=0;h<yearsWithRepetition.length;h++) {
            var arrToHoldRepetitions = [];

            for(var j=0;j<Object.keys(oldEvents).length;j++) {
                if(oldEvents[j]["start_date"]["year"] === yearsWithRepetition[h]) {
                    arrToHoldRepetitions.push(oldEvents[j]);
                    oldEvents[j].isDuplicate = "duplicate";
                }
            }

            allYears.splice( $.inArray(yearsWithRepetition[h],allYears),1);
            newEvents.push(arrToHoldRepetitions);
        }

        for(var k=0;k<Object.keys(oldEvents).length;k++) {
            if(oldEvents[k].isDuplicate != "duplicate") {
                newEvents.push([oldEvents[k]]);
            }
        }

        return newEvents;
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
        var day;
        var month;
        var year;

        if(typeof(eventObj) === 'object') {
            numEvents = Object.keys(eventObj).length;
        }
        else {
            numEvents = eventObj.length;
        }

        var dates = [];
        var tmpDates = [];
        for(var j=0;j<numEvents;j++) {
            tmpDates = [];
            if(!Number.isInteger(eventObj[j][0][3])) {
                for(var i=0;i<eventObj[j][0].length;i++) {
                    if (typeof eventObj[j][0][i][1]  !== "undefined" && eventObj[j][0][i][1]) {
                        day = eventObj[j][0][i][1].day;
                        month = eventObj[j][0][i][1].month;
                        year = eventObj[j][0][i][1].year;
                    }
                    else {
                        day = eventObj[j][0][1].day;
                        month = eventObj[j][0][1].month;
                        year = eventObj[j][0][1].year;
                    }
                    tmpDates.push(this.formatDate(day, month, year));
                }
            }
            else {
                day = eventObj[j][0][1].day;
                month = eventObj[j][0][1].month;
                year = eventObj[j][0][1].year;
                tmpDates.push(this.formatDate(day, month, year));
            }
            dates.push(tmpDates);
        }
        return dates;
    },

    formatDate: function(day, month, year) {
        var formatted_date;

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
        return formatted_date;
    },

    round: function(value, precision) {
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
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
                currDate += "/01";
            }
            dates.push(new Date(currDate))
        }

        minandmax.push(moment(new Date(Math.min.apply(null,dates)), moment.ISO_8601).format("dddd, MMMM Do YYYY"));
        minandmax.push(moment(new Date(Math.max.apply(null,dates)), moment.ISO_8601).format("dddd, MMMM Do YYYY"));

        var currNum = parseInt(moment(new Date(Math.min.apply(null,dates)), moment.ISO_8601).format("YYYY"));

        minandmax.push(this.getNearest("Down",5,parseInt(moment(new Date(Math.min.apply(null,dates)), moment.ISO_8601).format("YYYY"))));

        minandmax.push(this.getNearest("Up",5,parseInt(moment(new Date(Math.max.apply(null,dates)), moment.ISO_8601).format("YYYY"))));
        return minandmax;
    },
    isEmpty: function(value){
      return (value == null || value === '');
    },

    //code adapted from http://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
    pickTextColorBasedOnBgColorAdvanced: function(bgColor, lightColor, darkColor) {
      var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
      var r = parseInt(color.substring(0, 2), 16); // hexToR
      var g = parseInt(color.substring(2, 4), 16); // hexToG
      var b = parseInt(color.substring(4, 6), 16); // hexToB
      var uicolors = [r / 255, g / 255, b / 255];
      var c = uicolors.map(function(col) {
        if (col <= 0.03928) {
          return col / 12.92;
        }
        return Math.pow((col + 0.055) / 1.055, 2.4);
      });

      var Lvar = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);

        if (Lvar > 0.179) {
            return darkColor;
        }
        else {
            return lightColor;
        }
    },
     /**
     * Sort object properties (only own properties will be sorted).
     * @param {object} obj object to sort properties
     * @param {bool} isNumericSort true - sort object properties as numeric value, false - sort as string value.
     * @param {bool} reverse false - reverse sorting.
     * @returns {Array} array of items in [[key,value],[key,value],...] format.
     function adopted from  https://gist.github.com/umidjons/9614157
     */
    sortPropertiesByObj: function(obj, isNumericSort, reverse) {
        isNumericSort = isNumericSort || false; // by default text sort
        reverse = reverse || false; // by default no reverse

        var reversed = (reverse) ? -1 : 1;

        var sortable = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                sortable.push([key, obj[key]]);
            }
        }
        sortable.sort(function (a, b) {
            return reversed * (parseInt(a[1][0]["start_date"]["year"]) - parseInt(b[1][0]["start_date"]["year"]));
        });

        return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
    }
  };


  return app;
});
