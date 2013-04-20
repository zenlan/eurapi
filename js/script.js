function getKey() {
  return 'APIKey';
}

/* MISC FUNCTIONS */

function sanitizeText(string) {
  var result = string;
  var tmp1 = $(result).text();
  if (tmp1 != '') {
    result = tmp1;
  }
  var tmp2 = html_sanitize(result);
  if (tmp2 != '') {
    result = tmp2;
  }
  return result;
}

/* ISOTOPE FUNCTIONS */

function initIsotope($container) {
  $container.isotope({
    itemSelector : '.iso',
    layoutMode: 'masonry',
    masonry: {
      columnWidth : 50
    }
  });
}

function resetIsotope($container) {
  $container.empty();
  $container.isotope('destroy');
  initIsotope($container);
}

function shuffleIsotope() {
  $.myElems.results.isotope('shuffle');
}

/* STORAGE FUNCTIONS */

function autoSearch(data) {
  $.myElems.searchBtn.autocomplete( "option", "source", localStorage.getRecentQueries());
}

function getRecentQueries() {
  var recentQueries = [];
  if(typeof(Storage)!=='undefined') {
    var item = localStorage.getItem('eurapi:recent');
    if (item !== null) {
      recentQueries = JSON.parse(item);
    }
  }
  return recentQueries;
}

function saveQuery(query) {
  if (query == '' || query == '*') {
    return;
  }
  if(typeof(Storage) !== 'undefined') {
    var recentQueries = getRecentQueries();
    if ($.inArray(query, recentQueries) == -1) {
      if (recentQueries.length == 10) {
        recentQueries.shift();
      }
      recentQueries.push(query);
      localStorage.setItem('eurapi:recent', JSON.stringify(recentQueries));
    }
  }
}

function buildRecentQueriesDatalist(selected) {
  $.myElems.recent.empty();
  var recentQueries = getRecentQueries();
  $.each(recentQueries, function(i,item) {
    $.myElems.recent.append('<option value="' + item + '">');
  });
}


/* SEARCH FUNCTIONS */

function handleSearchResults(data) {
  var items = [], elem;
  $.each(data.items, function(i,item){
    if (item.hasOwnProperty('edmPreview')) {
      var classes = 'iso ' + item.type;
      elem = '<li class="' + classes
      + '" data-number="' + i
      + '" Tooltip="' + item.title
      + '" ObjID="' + item.id
      + '" ObjURL="' + item.link
      + '" ObjType="' + item.type
      + '" ObjExt="' + item.guid
      + '">'
      + '<img src="' + item.edmPreview + '"/>'
      + '</li>';
      items.push(elem);
    }
  });
  var $items = $(items.join(''));
  $items.imagesLoaded(function(){
    $items.each(function(){
      var $this = $(this);
      $this.click(function(){
        var url = $(this).attr('objext');
        window.showModalDialog(url); //, arguments, options)
      });
      var toolTip = $this.attr('Tooltip');
      $(this).hover(function(event) {
        $('<div class="tooltip"></div>').text(toolTip)
        .appendTo('body')
        .css('top', (event.pageY - 10) + 'px')
        .css('left', (event.pageX + 20) + 'px')
        .fadeIn('slow');
      }, function() {
        $('.tooltip').remove();
      }).mousemove(function(event) {
        $('.tooltip')
        .css('top', (event.pageY - 10) + 'px')
        .css('left', (event.pageX + 20) + 'px');
      });
    });
    $.myElems.results.isotope('insert', $items );
  });
};

function search() {
  var limit = 48; //max=96
  var offset = $.myElems.offset.val();
  if (offset > 1) {
    limit = 10;
  }
  var qry = $.myElems.query.val();
  var cat = '';
  //http://preview.europeana.eu/api/v2/search.json?profile=standard&wskey=M5r5KUk5p&rows=20&start=0&query=betty&qf=TYPE:IMAGE&callback=jQuery191028435505530796945_1362058963580&_=1362058963581
  //http://preview.europeana.eu/api/v2/search.json?profile=standard&wskey=M5r5KUk5p&rows=40&start=0&query=netsuke&qf=TYPE:IMAGE
  if ($.myElems.category.val() !== '') {
    cat = '&qf=TYPE:' + $.myElems.category.val();
  }
  $.myElems.offset.val(parseInt(limit) + parseInt(offset));
  qry = $.trim(qry);
  if (qry == '') {
    qry = '*';
  }
  else {
    saveQuery(qry);
    buildRecentQueriesDatalist(qry);
  }
  var url = $.BaseURLS.urlAPI
  + '&rows=' + limit
  + '&start=' + offset
  + '&query=' + qry + cat;
  $( "#debug" ).append( "<p>ajax request " + url + "</p>" );
  var ajax = $.ajax ({
    url: url,
    type: 'GET',
    dataType: 'jsonp',
    cache: false,
    contentType: 'application/json',
    statusCode: {
      500: function() {
        alert("internal server error");
      }
    }
  });
  ajax.done(function (response, textStatus, jqXHR){
    handleSearchResults(response);
  });
  ajax.fail(function (jqXHR, textStatus, errorThrown){
    alert('ajax fail: ' + textStatus);
  });
}

/* INITIALISATION */

function initBaseURLS() {
  $.BaseURLS = {};
  $.BaseURLS.urlAPI = 'http://www.europeana.eu/api/v2/search.json?profile=standard&wskey=' + getKey();
  $.BaseURLS.urlObj = 'http://www.europeana.eu/api/v2/record/';
  $.BaseURLS.urlImg = 'http://europeanastatic.eu/api/image?type=IMAGE&size=BRIEF_DOC&uri=';
}

function initInfiniteScroll() {
  var previousScroll = 0;
  var currentScroll = 0;
  $(window).scroll(function(data) {
    if ($('#infinite:checked').val()) {
      currentScroll = $(this).scrollTop();
      if (currentScroll > previousScroll){
        if ($.myElems.offset.val()>1) {
          search();
        }
      }
    }
    previousScroll = currentScroll;
  });
}

function resetEverything() {
  resetIsotope($.myElems.results);
  $.myElems.offset.val('1');
  $.myElems.query.val('');
//  $.myElems.category.val('');
}

function initElements() {

  $.myElems = {};
  $.myElems.results = $(document.getElementById('results-list'));
  $.myElems.query = $(document.getElementById('query'));
  $.myElems.offset = $(document.getElementById('offset'));
  $.myElems.searchBtn = $(document.getElementById('search'));
  $.myElems.recent = $(document.getElementById('recent'));
  $.myElems.category = $(document.getElementById('category'));
}

try {
  jQuery(document).ready(function($) {

    initBaseURLS();
    initElements();
    initIsotope($.myElems.results);

    //    var msie = /msie/.test(navigator.userAgent.toLowerCase());
    //    if (msie == true) {
    //      $.myElems.results.append('<li>Best viewed in Chrome browser</li>');
    //    }

    buildRecentQueriesDatalist();
    initInfiniteScroll();

    $('#reset').click(function(){
      resetEverything();
    });

    $('#infinite').change(function(){
      initInfiniteScroll();
    });

    $('#shuffle').click(function(){
      shuffleIsotope();
    });

    $.myElems.searchBtn.click(function(){
      search();
    });

    var hash = document.location.hash;
    if (hash) {
      var qry = sanitizeText(hash.substr(1));
      $.myElems.query.val(qry);
      $.myElems.searchBtn.click();
    }

  });

} catch (error) {
  console.error("Your javascript has an error: " + error);
}