define(['jquery', 'ractive', 'rv!templates/template', 'text!css/my-widget_embed.css'], function ($, Ractive, mainTemplate, css) {

  'use strict';

document.getElementById('one')

  var app = {
    init: function () {

    var $style = $("<style></style>", {type: "text/css"});
    var width = document.getElementById('omnistory-widget').getAttribute('data-width');
    var height = document.getElementById('omnistory-widget').getAttribute('data-height');

    $style.text(css);
    $("head").append($style);

      // render our main view
      this.ractive = new Ractive({
        el: 'myWidget',
        template: mainTemplate,
        data: {
          count: 0,
          ts: 'never',
          width: width,
          height: height,
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
    }
  };

  return app;

});
