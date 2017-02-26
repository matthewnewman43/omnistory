define(['jquery', 'ractive', 'rv!templates/template', 'text!css/my-widget_embed.css'], function ($, Ractive, template, css) {

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

        var dateRange = this.getMinAndMax(json.events, errorChecking);
        this.cleanUpValues(json,errorChecking,jsonLevels);
        console.log(json);

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
            }
          });
          this.ractive.on({
            mwClick: function(ev) {
              ev.original.preventDefault()
              this.set('count', this.get('count') + 1);
              var that = this;
              $.ajax({
                url: "http://date.jsontest.com/",
                dataType: "jsonp"
              }).then(function(response) {
                that.set("ts", response.time);
              }, function(response) {
                that.set("ts", "Something bad happened");
              });
            },
          });
      }, 500);


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
                        funcData[nameOfFirstLevel][success[2][h]][nameOfSecondLevel][success[0][h]] = "";
                    }
                    else {
                        var arrayForSides = Object.keys(funcData[nameOfFirstLevel][nameOfSecondLevel]);
                        funcData[nameOfFirstLevel][nameOfSecondLevel]["Side" + (success[2][h] + 1)][success[0][h]] = "";
                    }
                }
            }
        }
        console.log("func");
        console.log(funcData);
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

        var maxDate=new Date(Math.max.apply(null,dates));
        var minDate=new Date(Math.min.apply(null,dates));

        minandmax.push(new Date(Math.max.apply(null,dates)));
        minandmax.push(new Date(Math.min.apply(null,dates)));

        if(err) {
            console.log("Max Date: " + maxDate);
            console.log("Min Date: " + minDate);
        }
        return minandmax;
    }



  };

  return app;

});
