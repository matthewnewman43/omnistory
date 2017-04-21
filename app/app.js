define(['jquery', 'ractive', 'rv!templates/template', 'text!css/my-widget_embed.css','moment', 'jqueryUi','spreadsheets'], function ($, Ractive, template, css, moment, autocomplete,spreadsheets) {

  'use strict';

  var app = {
    init: function () {


    var $style = $("<style></style>", {type: "text/css"});
    var width = document.getElementById('omnistory-widget').getAttribute('width');
    var height = document.getElementById('omnistory-widget').getAttribute('height');
    var jsonData = document.getElementById('omnistory-widget').getAttribute('data');
    var authName = document.getElementById('omnistory-widget').getAttribute('Author-Name');
    var authEmail = document.getElementById('omnistory-widget').getAttribute('Author-Email');

    console.log(authName);
    console.log(authEmail);

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
    var eventSameYearPadding = 6;
    var offset = 6;


    //enables entire application to either start collapsed or opened
    var startCollapsed = true;

    //controls the fade out of the timeline axis pieces
    var durationOfFade = 100;

    var sideInfo = [
        ["American Colonists","#6891E2"],
        ["British Empire","#CD2020"],
        ["Test Colonists","#553535"]
    ];

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

    amtSides = Object.keys(json.title.sides).length;
    amtEvents = Object.keys(json.events).length;
    amtEvents = Object.keys(json.events).length;

    //gets min and max range for timeline scale
    var dateRange = this.getMinAndMax(json.events, errorChecking);

    //any variables not given in json are turned into empty strings
    //json = this.cleanUpValues(json,errorChecking,jsonLevels);

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
        console.log(json.title);
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
                var setNewPositionOfAxis = function(prevEvent, newEvent, durationOfAnimation) {
                    prevEvent = "._event-" + prevEvent;
                    newEvent = "._event-" + newEvent;

                    var prevLeft, newLeft, prevHasData=false,newHasData=false;
                    var currPosAxis = $("._axis.ui-draggable.ui-draggable-handle").css("left");

                    console.log(prevEvent);
                    console.log(newEvent);


                    //checks to see whether or not event is in a section or if one of the related events is a title slide
                    if(prevEvent === "_event-title") {
                        prevLeft=0;
                    }
                    else if($(prevEvent).attr("class").split(" ")[1] === "_event-in-section") {
                        prevHasData = true;
                    }
                    else {
                        prevLeft= $(prevEvent).css("left");
                    }

                    if(newEvent === "_event-title") {
                        newLeft=0;
                    }
                    else if($(newEvent).attr("class").split(" ")[1] === "_event-in-section") {
                        newHasData = true;
                    }
                    else {
                        newLeft= $(newEvent).css("left");
                    }


                    //sets data whether in a section or not
                    if(prevHasData) {
                        prevLeft = $(prevEvent).data('left_pos');
                    }
                    else {
                        prevLeft = parseInt(prevLeft.substring(0,prevLeft.length-2));
                    }

                    if(newHasData) {
                        newLeft = $(newEvent).data('left_pos');
                    }
                    else {
                        newLeft = parseInt(newLeft.substring(0,newLeft.length-2));
                    }

                    currPosAxis = parseInt(currPosAxis.substring(0,currPosAxis.length-2));

                    var newAxisLeftPos = currPosAxis + (prevLeft-newLeft);


                    console.log("prev")-
                    console.log(prevLeft);

                    console.log("new");
                    console.log(newLeft);

                    console.log("axis old");
                    console.log(currPosAxis);

                    console.log("difference");
                    console.log(prevLeft - newLeft);

                    console.log("axis new");
                    console.log(newAxisLeftPos);

                    $("#_axis").animate({"left":newAxisLeftPos}, durationOfAnimation)
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
                    $("._content-container-omnistory._expanded").css("min-height",largestHeight);
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
                        var heightOfThisEventSection = ($(this).children().length * sizeOfEventBubble) + (2*eventSameYearPadding);
                        $(this).css({"height":heightOfThisEventSection});
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
                        setNewPositionOfAxis(whichevent,tryingToGoTo,500);
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



                //expands all elements of the timeline that are hidden
                var expandTimeline = function() {
                    $("._content-container-omnistory").addClass("_expanded");
                    //figures out min-height (height of largest inner container)
                    findAndSetLargestHeight();

                    setTimeout(function() {
                        $("._slide-img-caption").show();
                    }, 200);

                    $("._expandControl").addClass("_expand-control").removeClass("_collapse-control");

                    if($("._active-event").attr("class").split(" ")[1] === "_event-title") {
                        console.log("did it work");
                        setCaptionAndImgResize(paddingForImages);
                    }
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



                /* code based on http://stackoverflow.com/questions/30074246/how-to-create-ripple-effect-on-click-material-design*/
                var clickAnimation = function(that, e, which) {
                    // Remove any old one
                      $(".ripple").remove();

                      // Setup
                      var posX = $(that).offset().left,
                          posY = $(that).offset().top,
                          buttonWidth = $(that).width(),
                          buttonHeight =  $(that).height();

                    if(which === "key") {
                        posX = $(that).offset().left + parseInt($(that).css("padding-left").substr(0,$(that).css("padding-left").length -2));
                        posY = $(that).offset().top;
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

                        if(which === "key") {
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
                var setCaptionAndImgResize = function(padding) {
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
                        clickAnimation(that, e);
                        expandTimeline();
                    }
                    else if(statusOfTimeline === "expanded") {
                        clickAnimation(that, e);
                        collapseTimeline();
                    }
                });

                //if the legend is clicked
                $('div[class ^= _stakeholder]').click(function(e) {
                    var that = this;
                    clickAnimation(that, e, "key");


                    curr_side = this.classList[0][17];
                    var event = $("._active-event").attr('class').split(" ")[1];
                    var durationOfColorChange = 500;

                    if(!$("._key-colorside"+curr_side).hasClass("_active-color")) {
                        $("._key-colorside"+curr_side).addClass("_active-color");
                        curr_color = colors[curr_side];
                        if(!animationHappening) {
                            setEverythingToColors(curr_color, "change", event, durationOfColorChange);
                        }
                        hideSides(curr_side);
                        $("div:not(._key-colorside"+curr_side+")").removeClass("_active-color");
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

                    var leftForSection = parseFloat($(that).css("left").substring(0,$(that).css("left").length-2)) - offset;

                    if(parseFloat($(that).css("left").substring(0,$(that).css("left").length-2)) % 5) {
                        //leftForSection = leftForSection - 1;
                    }

                    $(that).parent().css({"left":leftForSection,"padding-bottom":eventSameYearPadding}).addClass("_clicked");

                    $("._eventSection._clicked ._event-in-section").each(function() {
                        var heightForIndividualEvents = (whichEvent * sizeOfEventBubble)+((eventSameYearPadding) + (1*whichEvent));
                        var marginTop = whichEvent*2.5;

                        $(this).css({"top":heightForIndividualEvents,"margin-top":marginTop,"left":offset}).addClass("_opened-event");
                        whichEvent++;
                    });
                }

                //right button clicked
                $('._right-control').click(function() {
                    //if event is not currently changing then start the process to change the event
                    if(!eventChanging) {
                        eventChanging = true;
                        whicheventfunc("right");
                    }

                    //waits about how long it takes for the change of event plus a little extra
                    setTimeout(function() {
                        eventChanging = false;
                    },(durationOfChangeEventAnimations*2)+150)
                });

                //left button clicked
                $('._left-control').click(function() {
                    //if event is not currently changing then start the process to change the event
                    if(!eventChanging) {
                        eventChanging = true;
                        whicheventfunc("left");
                    }

                    //waits about how long it takes for the change of event plus a little extra
                    setTimeout(function() {
                        eventChanging = false;
                    },(durationOfChangeEventAnimations*2)+150)
                });

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
                },200);
            }
          });
      }, 200);
    },
    getColors: function(amtSides, sidesArr) {
        var colors = [];
        for(var j=0;j<amtSides;j++) {
            var newColors = [];
            var currColor = sidesArr["side" + j].color;
            newColors.push(this.hexToRgbA(currColor,0.4));
            newColors.push(this.hexToRgbA(currColor,0.8));
            newColors.push(this.shadeColor(currColor,-50));
            newColors.push(currColor);
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
    cleanUpValues: function(funcData, err, data) {
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

            if(col===0) {
                newJson.title.media.url = currRow[8];
                newJson.title.media.caption = currRow[10];
                newJson.title.media.credit = currRow[9];

                newJson.title.text.headline = currRow[6];
                newJson.title.text.text = currRow[7];

                for(var h=0;h<amtOfSides;h++) {
                    var whichSide = 11+h;
                    newJson.title.sides["side" + h].name = sideInfo[h][0];
                    newJson.title.sides["side" + h].color = sideInfo[h][1];
                    newJson.title.sides["side" + h].description = currRow[whichSide];
                }
            }
            else {
                //sets values of the new json to current event
                //substracts 1 to account for the title slide
                newJson.events[col-1].start_date.year = currRow[0];
                newJson.events[col-1].start_date.month = currRow[1];
                newJson.events[col-1].start_date.day = currRow[2];

                newJson.events[col-1].media.url = currRow[8];
                newJson.events[col-1].media.credit = currRow[9];
                newJson.events[col-1].media.caption = currRow[10];

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
    },
    isEmpty: function(value){
      return (value == null || value === '');
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
