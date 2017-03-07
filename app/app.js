define(['jquery', 'ractive', 'rv!templates/template', 'text!css/my-widget_embed.css','moment', 'jqueryUi'], function ($, Ractive, template, css, moment, autocomplete) {

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


    //two main inputs of data right now are through json and by a link that returns json
    // if json is valid, if it is parses it
    if (this.checkIfJsonValid(jsonData, errorChecking)) {
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

    //first array is first level
    //second array is second level
    //from 2-however many of the rest there are the keys underneath the first array
    var jsonLevels = {};
    jsonLevels.events = {};
    jsonLevels.title = {};
    jsonLevels.events.media = ["url","credit","caption"];
    jsonLevels.events.start_date = ["year","month","day"];
    jsonLevels.events.text = ["facts","headline","side1","side2"];
    jsonLevels.title.media = ["caption","credit","url"];
    jsonLevels.title.sides = ["Name","Description","Color"];
    jsonLevels.title.text = ["headline","text"];

    //gets min and max range for timeline scale
    var dateRange = this.getMinAndMax(json.events, errorChecking);
    //console.log("Data range of events");
    //console.log(dateRange);

    //any variables not given in json are turned into empty strings
    json = this.cleanUpValues(json,errorChecking,jsonLevels);
    //console.log("Cleaned up json");
    console.log(json);

    var date_arr = [];
    for(var j=0;j<json.events.length;j++) {
        var formatted_date;

        var day = json.events[j].start_date.day;
        var month = json.events[j].start_date.month;
        var year = json.events[j].start_date.year;

        var date = year;
        var perfect_date = true;

        if(day === "00") {
            date += "/01";
            perfect_date = false;
        }
        else if(day < 10 && day != "00") {
            date += "/0" + day;
        }
        else {
            date += "/" + day;
        }

        if(month === "00") {
            date += "/01";
            perfect_date = false;
        }
        else if(month < 10 && month != "00") {
            date += "/0" + month;
        }
        else {
            date += "/" + month;
        }

        if(perfect_date) {
            formatted_date = moment(new Date(date), moment.ISO_8601).format("dddd, MMMM Do YYYY");
        }
        else {
            formatted_date = moment(new Date(date), moment.ISO_8601).format("MMMM, YYYY");
        }
        date_arr.push(formatted_date);
    }
    console.log(date_arr);
    //var dates = this.getIndividualFormattedDates(json.);

    //gets all the colors necessary for styling everything
    //first number is which side to choose, second is which color
    //ex [0][0] => first side's opaque color
    var colors = this.getColors(json.title.sides.Side1.Color, json.title.sides.Side2.Color);
    //console.log("Colors to be used throughout project");
    //console.log(colors);

    $style.text(css);
    $("head").append($style);

    setTimeout(function(){
          // render our main view
          this.ractive = new Ractive({
            el: 'myWidget',
            template: template,
            magic: true,
            data: {
              count: 0,
              ts: 'never',
              width: width,
              height: height,
              json: json,
              sides: json.title.sides,
              range: dateRange[0] + " - " + dateRange[1],
              date_array: date_arr
            },
            oncomplete: function(){
                //functions
                var hide_axis = function(classToCheck, durationOfFade, startOrNah) {
                    var original_line_left = $("._line").offset().left;
                    var original_line_right = original_line_left + $("._line").width();

                    $("." + classToCheck).each(function() {
                        var offset = $(this).offset();
                        var posLeft = offset.left - 15;
                        var posRight = offset.left + 20;


                        //left side
                        if(posLeft < original_line_left) {
                            //left side minor
                            if(classToCheck === "_axisMinor") {
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
                            if(classToCheck === "_axisMinor") {
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
                                if(classToCheck === "_axisMinor") {
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
                                if(classToCheck === "_axisMinor") {
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
                    setEvent(curr_event, curr_color, titleOrNah);
                };
                var setEverythingToColors = function(color, notInit, event, duration) {
                    var colorShadow = "5px 5px 5px " + color[2];
                    if(notInit === "change") {
                        $( "._inner-info-container." +event ).effect("fold",{},duration/2);
                    }
                    setTimeout(function(){
                        if(notInit === "change") {
                            $( "._inner-info-container."+event).fadeIn(duration);
                        }
                        $( "._inner-info-container" ).animate({
                                backgroundColor:color[0],
                        }, duration/2);
                        $( "._inner-info-title-container" ).animate({
                                backgroundColor:color[1],
                        }, duration);
                        $( ".fa-caret-right, .fa-caret-left" ).animate({
                                color: color[3],
                        }, duration);
                    }, duration);



                    //title circle
                    $("._active").css("color", color[3]);
                    //event circles
                    $("._event._active").css("background-color", color[3]);

                    //box shadows for inner square
                    $("._inner-info-container").css("-moz-box-shadow",colorShadow).css("-webkit-box-shadow",colorShadow).css("box-shadow",colorShadow);
                };
                var setEvent = function(event, color, which) {
                    var duration = 750;
                    if(which === "not") {
                        $(".title-icon,.title-icon-after").css("color","#000000");
                    }

                    $("._active").removeClass("_active _clicked");

                    //if what needs to be set is not title or start
                   if(which === "not") {
                        $("div."+event+"._event").addClass("_clicked");
                        setTimeout(function(){
                            $("div."+event+"._event").addClass("_active _clicked");
                            setEverythingToColors(curr_color, "change", event, duration);
                        }, 100);
                    }

                    //if what needs to be set is the title screen
                    else if(which === "title") {
                        $(".title-icon").addClass("_clicked");
                        setTimeout(function(){
                            $(".title-icon").addClass("_active _clicked");
                            $(".title-icon-after").addClass("_active _clicked");
                            setEverythingToColors(curr_color, "change", event, duration);
                        }, 100);
                    }

                    //if what needs to be set is in the beggining of the app
                    else if(which === "start") {
                        $(".title-icon").addClass("_active _clicked");
                        $(".title-icon-after").addClass("_active _clicked");
                        setEverythingToColors(curr_color, "start", event, duration);
                    }


                    //makes sure all not correct events get hidden and are not active
                    $("div:not("+event+")._inner-info-container").hide();
                    $("div:not("+event+")._inner-info-container").removeClass("_active-event");

                    $("div:not(."+event+")._event").css("background-color","#000000");

                    //shows correct event and adds active class
                    $("div."+event+"._inner-info-container").show();
                    $("div."+event+"._inner-info-container").addClass("_active-event");
                };
                var hideSides = function(side) {
                    side = side + 1;
                    $("div:not(.opinion-container-Side"+side+").opinion").hide();
                    $("div.opinion-container-Side" + side + ".opinion").show();
                };

                var curr_side = 0;
                var curr_color = colors[curr_side];
                var curr_event = "_event-title";
                var didItGo = false;

                //sets up app to start off properly
                if(!didItGo) {
                    $("._key-color1").addClass("_active-color");
                    setEvent(curr_event, curr_color, "start");
                    hideSides(curr_side);
                    hide_axis("_axisMinor", 200, "start");
                    hide_axis("_axisMajor", 200, "start");
                    didItGo = true;
                }

                //if the legend is clicked
                $('div[class ^= _side]').click(function() {
                    curr_side = this.classList[0][5];
                    var event = $("._active-event").attr('class').split(" ")[1];
                    var duration = 1000;

                    if(!$("._key-color"+curr_side).hasClass("_active-color")) {
                        $("._key-color"+curr_side).addClass("_active-color");
                        curr_color = colors[curr_side-1];
                        setEverythingToColors(curr_color, "change", event, duration);
                        hideSides(curr_side-1);
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
                    setEvent(curr_event, curr_color, "title");
                });


                //if one of the circles on the timeline are clicked
                $('div._event').click(function() {
                    //changes current event to one that was clicked on
                    curr_event = this.classList[1];
                    setEvent(curr_event, curr_color, "not");
                });

                //right button clicked
                $('.right-control').click(function() {
                    whicheventfunc("right");
                });

                //left button clicked
                $('.left-control').click(function() {
                    whicheventfunc("left");
                });

                $( "#_axis" ).draggable({ axis: "x" });


                //Checks left property about twice per second
                var watched = $("#_axis");
                var lastDisplay = watched.css("left");
                setInterval(function(){
                  var curDisplay = watched.css("left");

                  if (curDisplay!=lastDisplay){
                    hide_axis("_axisMinor", 200, "update");
                    hide_axis("_axisMajor", 200, "update");
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

    getMinAndMax: function(arr, err) {
        var dates=[];
        var minandmax=[];

        for (var key in arr) {
            var currDate = arr[key].start_date.year;
            if(typeof arr[key].start_date.month != "undefined") {
                if(arr[key].start_date.month < 10 && arr[key].start_date.month.length<2) {
                    currDate += "/0" + arr[key].start_date.month;
                }
                else {
                    currDate += "/" + arr[key].start_date.month;
                }
            }
            else {
                currDate += "/01";
            }

            if(typeof arr[key].start_date.day != "undefined") {
                if(arr[key].start_date.day < 10  && arr[key].start_date.day.length<2) {
                    currDate += "/0" + arr[key].start_date.day;
                }
                else {
                    currDate += "/" + arr[key].start_date.day;
                }
            }
            else {
                currDate += "/01";
            }
            dates.push(new Date(currDate))
            if(err) {
                console.log("Current Date: " + currDate);
            }
        }

        minandmax.push(moment(new Date(Math.min.apply(null,dates)), moment.ISO_8601).format("dddd, MMMM Do YYYY"));
        minandmax.push(moment(new Date(Math.max.apply(null,dates)), moment.ISO_8601).format("dddd, MMMM Do YYYY"));

        if(err) {
            console.log("Max Date: " + minandmax[0]);
            console.log("Min Date: " + minandmax[1]);
        }
        return minandmax;
    }



  };

  return app;

});
