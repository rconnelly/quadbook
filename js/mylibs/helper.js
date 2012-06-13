/*
 * MBP - Mobile boilerplate helper functions
 */
(function(document){

    window.MBP = window.MBP || {};

// Fix for iPhone viewport scale bug 
// http://www.blog.highub.com/mobile-2/a-fix-for-iphone-viewport-scale-bug/

    MBP.viewportmeta = document.querySelector && document.querySelector('meta[name="viewport"]');
    MBP.ua = navigator.userAgent;

    MBP.scaleFix = function () {
        if (MBP.viewportmeta && /iPhone|iPad|iPod/.test(MBP.ua) && !/Opera Mini/.test(MBP.ua)) {
            MBP.viewportmeta.content = "width=device-width, minimum-scale=1.0, maximum-scale=1.0";
            document.addEventListener("gesturestart", MBP.gestureStart, false);
        }
    };
    MBP.gestureStart = function () {
        MBP.viewportmeta.content = "width=device-width, minimum-scale=0.25, maximum-scale=1.6";
    };


    /*
     * Normalized hide address bar for iOS & Android
     * (c) Scott Jehl, scottjehl.com
     * MIT License
     */

// If we split this up into two functions we can reuse
// this function if we aren't doing full page reloads.

// If we cache this we don't need to re-calibrate everytime we call
// the hide url bar
    MBP.BODY_SCROLL_TOP = false;

// So we don't redefine this function everytime we
// we call hideUrlBar
    MBP.getScrollTop = function(){
        var win = window,
            doc = document;

        return win.pageYOffset || doc.compatMode === "CSS1Compat" && doc.documentElement.scrollTop || doc.body.scrollTop || 0;
    };

// It should be up to the mobile
    MBP.hideUrlBar = function(){
        var win = window;

        // if there is a hash, or MBP.BODY_SCROLL_TOP hasn't been set yet, wait till that happens
        if( !location.hash && MBP.BODY_SCROLL_TOP !== false){
            win.scrollTo( 0, MBP.BODY_SCROLL_TOP === 1 ? 0 : 1 );
        }
    };

    MBP.hideUrlBarOnLoad = function () {
        var win = window,
            doc = win.document;

        // If there's a hash, or addEventListener is undefined, stop here
        if( !location.hash && win.addEventListener ) {

            //scroll to 1
            window.scrollTo( 0, 1 );
            MBP.BODY_SCROLL_TOP = 1;

            //reset to 0 on bodyready, if needed
            bodycheck = setInterval(function() {
                if( doc.body ) {
                    clearInterval( bodycheck );
                    MBP.BODY_SCROLL_TOP = MBP.getScrollTop();
                    MBP.hideUrlBar();
                }
            }, 15 );

            win.addEventListener( "load", function() {
                setTimeout(function() {
                    //at load, if user hasn't scrolled more than 20 or so...
                    if( MBP.getScrollTop() < 20 ) {
                        //reset to hide addr bar at onload
                        MBP.hideUrlBar();
                    }
                }, 0);
            } );
        }
    };

// Fast Buttons - read wiki below before using
// https://github.com/h5bp/mobile-boilerplate/wiki/JavaScript-Helper
    MBP.fastButton = function (element, handler) {
        this.element = element;
        this.handler = handler;

        addEvt(element, "touchstart", this, false);
        addEvt(element, "click", this, false);
    };

    MBP.fastButton.prototype.handleEvent = function(event) {
        event = event || window.event;
        switch (event.type) {
            case 'touchstart': this.onTouchStart(event); break;
            case 'touchmove': this.onTouchMove(event); break;
            case 'touchend': this.onClick(event); break;
            case 'click': this.onClick(event); break;
        }
    };

    MBP.fastButton.prototype.onTouchStart = function(event) {
        event.stopPropagation();
        this.element.addEventListener('touchend', this, false);
        document.body.addEventListener('touchmove', this, false);
        this.startX = event.touches[0].clientX;
        this.startY = event.touches[0].clientY;
        this.element.style.backgroundColor = "rgba(0,0,0,.7)";
    };

    MBP.fastButton.prototype.onTouchMove = function(event) {
        if(Math.abs(event.touches[0].clientX - this.startX) > 10 ||
            Math.abs(event.touches[0].clientY - this.startY) > 10    ) {
            this.reset();
        }
    };

    MBP.fastButton.prototype.onClick = function(event) {
        event = event || window.event;
        if (event.stopPropagation) { event.stopPropagation(); }
        this.reset();
        this.handler(event);
        if(event.type == 'touchend') {
            MBP.preventGhostClick(this.startX, this.startY);
        }
        this.element.style.backgroundColor = "";
    };

    MBP.fastButton.prototype.reset = function() {
        rmEvt(this.element, "touchend", this, false);
        rmEvt(document.body, "touchmove", this, false);
        this.element.style.backgroundColor = "";
    };

    MBP.preventGhostClick = function (x, y) {
        MBP.coords.push(x, y);
        window.setTimeout(function (){
            MBP.coords.splice(0, 2);
        }, 2500);
    };

    MBP.ghostClickHandler = function (event) {
        if (!MBP.hadTouchEvent && 'ontouchstart' in window) {
            // This is a bit of fun for Android 2.3...
            // If you change window.location via fastButton, a click event will fire
            // on the new page, as if the events are continuing from the previous page.
            // We pick that event up here, but MBP.coords is empty, because it's a new page,
            // so we don't prevent it. Here's we're assuming that click events on touch devices
            // that occur without a preceding touchStart are to be ignored.
            event.stopPropagation();
            event.preventDefault();
            return;
        }
        for(var i = 0, len = MBP.coords.length; i < len; i += 2) {
            var x = MBP.coords[i];
            var y = MBP.coords[i + 1];
            if(Math.abs(event.clientX - x) < 25 && Math.abs(event.clientY - y) < 25) {
                event.stopPropagation();
                event.preventDefault();
            }
        }
    };

    if (document.addEventListener) {
        document.addEventListener('click', MBP.ghostClickHandler, true);
    }

    addEvt( document.documentElement, 'touchstart', function() {
        MBP.hadTouchEvent = true;
    }, false);

    MBP.coords = [];

// fn arg can be an object or a function, thanks to handleEvent
// read more about the explanation at: http://www.thecssninja.com/javascript/handleevent
    function addEvt(el, evt, fn, bubble) {
        if("addEventListener" in el) {
            // BBOS6 doesn't support handleEvent, catch and polyfill
            try {
                el.addEventListener(evt, fn, bubble);
            } catch(e) {
                if(typeof fn == "object" && fn.handleEvent) {
                    el.addEventListener(evt, function(e){
                        // Bind fn as this and set first arg as event object
                        fn.handleEvent.call(fn,e);
                    }, bubble);
                } else {
                    throw e;
                }
            }
        } else if("attachEvent" in el) {
            // check if the callback is an object and contains handleEvent
            if(typeof fn == "object" && fn.handleEvent) {
                el.attachEvent("on" + evt, function(){
                    // Bind fn as this
                    fn.handleEvent.call(fn);
                });
            } else {
                el.attachEvent("on" + evt, fn);
            }
        }
    }

    function rmEvt(el, evt, fn, bubble) {
        if("removeEventListener" in el) {
            // BBOS6 doesn't support handleEvent, catch and polyfill
            try {
                el.removeEventListener(evt, fn, bubble);
            } catch(e) {
                if(typeof fn == "object" && fn.handleEvent) {
                    el.removeEventListener(evt, function(e){
                        // Bind fn as this and set first arg as event object
                        fn.handleEvent.call(fn,e);
                    }, bubble);
                } else {
                    throw e;
                }
            }
        } else if("detachEvent" in el) {
            // check if the callback is an object and contains handleEvent
            if(typeof fn == "object" && fn.handleEvent) {
                el.detachEvent("on" + evt, function(){
                    // Bind fn as this
                    fn.handleEvent.call(fn);
                });
            } else {
                el.detachEvent("on" + evt, fn);
            }
        }
    }


// iOS Startup Image
// https://github.com/h5bp/mobile-boilerplate/issues#issue/2

    MBP.splash = function () {
        var filename = navigator.platform === 'iPad' ? 'h/' : 'l/';
        document.write('<link rel="apple-touch-startup-image" href="/img/' + filename + 'splash.png" />' );
    };


// Autogrow
// http://googlecode.blogspot.com/2009/07/gmail-for-mobile-html5-series.html

    MBP.autogrow = function (element, lh) {
        function handler(e){
            var newHeight = this.scrollHeight,
                currentHeight = this.clientHeight;
            if (newHeight > currentHeight) {
                this.style.height = newHeight + 3 * textLineHeight + "px";
            }
        }

        var setLineHeight = (lh) ? lh : 12,
            textLineHeight = element.currentStyle ? element.currentStyle.lineHeight :
                getComputedStyle(element, null).lineHeight;

        textLineHeight = (textLineHeight.indexOf("px") == -1) ? setLineHeight :
            parseInt(textLineHeight, 10);

        element.style.overflow = "hidden";
        element.addEventListener ? element.addEventListener('keyup', handler, false) :
            element.attachEvent('onkeyup', handler);
    };


// Enable active
// Enable CSS active pseudo styles in Mobile Safari
// http://miniapps.co.uk/blog/post/enable-css-active-pseudo-styles-in-mobile-safari/
    MBP.enableActive = function () {
        document.addEventListener("touchstart", function() {}, false);
    };


// Prevent iOS from zooming onfocus
// http://nerd.vasilis.nl/prevent-ios-from-zooming-onfocus/

    MBP.viewportMeta = $('meta[name="viewport"]');
    MBP.preventZoom = function () {
        $('input, select, textarea').bind('focus blur', function(event) {
            MBP.viewportMeta.attr('content', 'width=device-width,initial-scale=1,maximum-scale=' + (event.type == 'blur' ? 10 : 1));
        });
    };

})(document);

/** Plugins */


// place any Zepto/helper plugins in here, instead of separate, slower script files.

(function (Zepto) {

    var daysInWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var shortMonthsInYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var longMonthsInYear = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    var shortMonthsToNumber = [];
    shortMonthsToNumber["Jan"] = "01";
    shortMonthsToNumber["Feb"] = "02";
    shortMonthsToNumber["Mar"] = "03";
    shortMonthsToNumber["Apr"] = "04";
    shortMonthsToNumber["May"] = "05";
    shortMonthsToNumber["Jun"] = "06";
    shortMonthsToNumber["Jul"] = "07";
    shortMonthsToNumber["Aug"] = "08";
    shortMonthsToNumber["Sep"] = "09";
    shortMonthsToNumber["Oct"] = "10";
    shortMonthsToNumber["Nov"] = "11";
    shortMonthsToNumber["Dec"] = "12";

    Zepto.format = (function () {
        function strDay(value) {
            return daysInWeek[parseInt(value, 10)] || value;
        }

        function strMonth(value) {
            var monthArrayIndex = parseInt(value, 10) - 1;
            return shortMonthsInYear[monthArrayIndex] || value;
        }

        function strLongMonth(value) {
            var monthArrayIndex = parseInt(value, 10) - 1;
            return longMonthsInYear[monthArrayIndex] || value;
        }

        var parseMonth = function (value) {
            return shortMonthsToNumber[value] || value;
        };

        var parseTime = function (value) {
            var retValue = value;
            var millis = "";
            if (retValue.indexOf(".") !== -1) {
                var delimited = retValue.split('.');
                retValue = delimited[0];
                millis = delimited[1];
            }

            var values3 = retValue.split(":");

            if (values3.length === 3) {
                hour = values3[0];
                minute = values3[1];
                second = values3[2];

                return {
                    time: retValue,
                    hour: hour,
                    minute: minute,
                    second: second,
                    millis: millis
                };
            } else {
                return {
                    time: "",
                    hour: "",
                    minute: "",
                    second: "",
                    millis: ""
                };
            }
        };

        return {
            date: function (value, format) {
                /*
                 value = new java.util.Date()
                 2009-12-18 10:54:50.546
                 */
                try {
                    var date = null;
                    var year = null;
                    var month = null;
                    var dayOfMonth = null;
                    var dayOfWeek = null;
                    var time = null;
                    if (typeof value.getFullYear === "function") {
                        year = value.getFullYear();
                        month = value.getMonth() + 1;
                        dayOfMonth = value.getDate();
                        dayOfWeek = value.getDay();
                        time = parseTime(value.toTimeString());
                    } else if (value.search(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d{0,3}[-+]?\d{2}:?\d{2}/) != -1) { /* 2009-04-19T16:11:05+02:00 */
                        var values = value.split(/[T\+-]/);
                        year = values[0];
                        month = values[1];
                        dayOfMonth = values[2];
                        time = parseTime(values[3].split(".")[0]);
                        date = new Date(year, month - 1, dayOfMonth);
                        dayOfWeek = date.getDay();
                    } else {
                        var values = value.split(" ");
                        switch (values.length) {
                            case 6:
                                /* Wed Jan 13 10:43:41 CET 2010 */
                                year = values[5];
                                month = parseMonth(values[1]);
                                dayOfMonth = values[2];
                                time = parseTime(values[3]);
                                date = new Date(year, month - 1, dayOfMonth);
                                dayOfWeek = date.getDay();
                                break;
                            case 2:
                                /* 2009-12-18 10:54:50.546 */
                                var values2 = values[0].split("-");
                                year = values2[0];
                                month = values2[1];
                                dayOfMonth = values2[2];
                                time = parseTime(values[1]);
                                date = new Date(year, month - 1, dayOfMonth);
                                dayOfWeek = date.getDay();
                                break;
                            case 7:
                            /* Tue Mar 01 2011 12:01:42 GMT-0800 (PST) */
                            case 9:
                            /*added by Larry, for Fri Apr 08 2011 00:00:00 GMT+0800 (China Standard Time) */
                            case 10:
                                /* added by Larry, for Fri Apr 08 2011 00:00:00 GMT+0200 (W. Europe Daylight Time) */
                                year = values[3];
                                month = parseMonth(values[1]);
                                dayOfMonth = values[2];
                                time = parseTime(values[4]);
                                date = new Date(year, month - 1, dayOfMonth);
                                dayOfWeek = date.getDay();
                                break;
                            default:
                                return value;
                        }
                    }

                    var pattern = "";
                    var retValue = "";
                    /*
                     Issue 1 - variable scope issue in format.date
                     Thanks jakemonO
                     */
                    for (var i = 0; i < format.length; i++) {
                        var currentPattern = format.charAt(i);
                        pattern += currentPattern;
                        switch (pattern) {
                            case "ddd":
                                retValue += strDay(dayOfWeek);
                                pattern = "";
                                break;
                            case "dd":
                                if (format.charAt(i + 1) == "d") {
                                    break;
                                }
                                if (String(dayOfMonth).length === 1) {
                                    dayOfMonth = '0' + dayOfMonth;
                                }
                                retValue += dayOfMonth;
                                pattern = "";
                                break;
                            case "MMMM":
                                retValue += strLongMonth(month);
                                pattern = "";
                                break;
                            case "MMM":
                                if (format.charAt(i + 1) === "M") {
                                    break;
                                }
                                retValue += strMonth(month);
                                pattern = "";
                                break;
                            case "MM":
                                if (format.charAt(i + 1) == "M") {
                                    break;
                                }
                                if (String(month).length === 1) {
                                    month = '0' + month;
                                }
                                retValue += month;
                                pattern = "";
                                break;
                            case "yyyy":
                                retValue += year;
                                pattern = "";
                                break;
                            case "yy":
                                if (format.charAt(i + 1) == "y" &&
                                    format.charAt(i + 2) == "y") {
                                    break;
                                }
                                retValue += String(year).slice(-2);
                                pattern = "";
                                break;
                            case "HH":
                                retValue += time.hour;
                                pattern = "";
                                break;
                            case "hh":
                                /* time.hour is "00" as string == is used instead of === */
                                var hour = (time.hour == 0 ? 12 : time.hour < 13 ? time.hour : time.hour - 12);
                                hour = String(hour).length == 1 ? '0'+hour : hour;
                                retValue += hour;
                                pattern = "";
                                break;
                            case "h":
                                if (format.charAt(i + 1) == "h") {
                                    break;
                                }
                                var hour = (time.hour == 0 ? 12 : time.hour < 13 ? time.hour : time.hour - 12);
                                retValue += hour;
                                pattern = "";
                                break;
                            case "mm":
                                retValue += time.minute;
                                pattern = "";
                                break;
                            case "ss":
                                /* ensure only seconds are added to the return string */
                                retValue += time.second.substring(0, 2);
                                pattern = "";
                                break;
                            case "SSS":
                                retValue += time.millis.substring(0, 3);
                                pattern = "";
                                break;
                            case "a":
                                retValue += time.hour >= 12 ? "PM" : "AM";
                                pattern = "";
                                break;
                            case " ":
                                retValue += currentPattern;
                                pattern = "";
                                break;
                            case "/":
                                retValue += currentPattern;
                                pattern = "";
                                break;
                            case ":":
                                retValue += currentPattern;
                                pattern = "";
                                break;
                            default:
                                if (pattern.length === 2 && pattern.indexOf("y") !== 0 && pattern != "SS") {
                                    retValue += pattern.substring(0, 1);
                                    pattern = pattern.substring(1, 2);
                                } else if ((pattern.length === 3 && pattern.indexOf("yyy") === -1)) {
                                    pattern = "";
                                }
                        }
                    }
                    return retValue;
                } catch (e) {
                    console.log(e);
                    return value;
                }
            }
        };
    }());
}(Zepto));

Zepto.format.date.defaultShortDateFormat = "dd/MM/yyyy";
Zepto.format.date.defaultLongDateFormat = "dd/MM/yyyy hh:mm:ss";

Zepto(document).ready(function () {
    Zepto(".shortDateFormat").each(function (idx, elem) {
        if (Zepto(elem).is(":input")) {
            Zepto(elem).val(Zepto.format.date(Zepto(elem).val(), Zepto.format.date.defaultShortDateFormat));
        } else {
            Zepto(elem).text(Zepto.format.date(Zepto(elem).text(), Zepto.format.date.defaultShortDateFormat));
        }
    });
    Zepto(".longDateFormat").each(function (idx, elem) {
        if (Zepto(elem).is(":input")) {
            Zepto(elem).val(Zepto.format.date(Zepto(elem).val(), Zepto.format.date.defaultLongDateFormat));
        } else {
            Zepto(elem).text(Zepto.format.date(Zepto(elem).text(), Zepto.format.date.defaultLongDateFormat));
        }
    });
});

(function($){

    $.fn.tmpl = function(d) {
        var s = $(this[0]).html().trim();
        if (d) {
            for (k in d) {
                s = s.replace(new RegExp('\\${' + k + '}', 'g'), d[k]);
            }
        }
        return $(s);
    }

    $.fn.exists = function(){return this.length>0;}
})(Zepto);

$('document').ready(function(){
    $('#pageSelect').bind('change',function(evt){
        window.location = $(this).val();
    });
});

$('document').ready(function () {
    if($('#twitterPost').exists())
    {
        $.getJSON('https://api.twitter.com/1/statuses/user_timeline.json?include_entities=true&include_rts=true&screen_name=ioquad&count=5&callback=?',
            function (data, textStatus) {
                $(data).each(function () {
                    var postDate = new Date(this.created_at);
                    this.created_at = $.format.date(postDate, 'MM/dd/yyyy h:mma');
                    $('#twitterPost').tmpl(this).appendTo('section.twitter');
                });
            });
    }
});