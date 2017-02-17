define(['jquery', 'ractive', 'rv!templates/template', 'text!css/my-widget_embed.css'], function ($, Ractive, template, css) {

  'use strict';

document.getElementById('one')

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
    if (checkIfJsonValid(jsonData, errorChecking)) {
        json = JSON.parse(jsonData);
    }
    // if input is valid url it parses data into an array
    else if(ValidUrL(jsonData, errorChecking)) {
        getJSON(jsonData,
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

    $style.text(css);
    $("head").append($style);

    console.log(json);

    setTimeout(function(){
    var dateRange = getMinAndMax(json.events, errorChecking);

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
        }
      });
      }, 500);
    }
  };



    var getJSON = function(url, callback) {
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
    };

    var ValidUrL = function(str, err) {
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
    };

    var checkIfJsonValid = function(text,err) {
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
    };

    var getMinAndMax = function(arr, err) {
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

  return app;

});
