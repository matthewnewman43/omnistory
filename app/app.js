define(['jquery', 'ractive', 'rv!templates/template', 'text!css/my-widget_embed.css'], function ($, Ractive, template, css) {

  'use strict';

document.getElementById('one')

  var app = {
    init: function () {

    var $style = $("<style></style>", {type: "text/css"});
    var width = document.getElementById('omnistory-widget').getAttribute('width');
    var height = document.getElementById('omnistory-widget').getAttribute('height');
    var jsonData = document.getElementById('omnistory-widget').getAttribute('data');
    var json = [];

    //two main inputs of data right now are through json and by a link that returns json
    // if json is valid, if it is parses it
    if (checkIfJsonValid(jsonData)) {
        json = JSON.parse(jsonData);
    }
    // if input is valid url it parses data into an array
    else if(ValidUrL(jsonData)) {
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

    var ValidUrL = function(str) {
        var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
        if(!regex.test(str)) {
            return false;
        } else {
            return true;
        }
    };

    var checkIfJsonValid = function(text) {
        if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
        replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
        replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
            return true;
        }
        return false;
    };

  return app;

});
