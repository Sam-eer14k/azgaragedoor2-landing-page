(function(){
  "use strict";
  var $  = function(s,c){ return (c||document).querySelector(s); };
  var $$ = function(s,c){ return Array.prototype.slice.call((c||document).querySelectorAll(s)); };
  var mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var lessMotion = mqMotion.matches;
  var isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  document.getElementById("yr").textContent = new Date().getFullYear();

  /* =========================================================
     1. CUSTOM CURSOR
     Dot tracks the pointer, ring trails behind with lerp.
     Disabled outright on touch devices.
     ========================================================= */
  (function cursor(){
    if(isTouch || lessMotion) return;
    var dot = $("#cur"), ring = $("#curRing"), txt = $("#curTxt");
    var mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my, on = false;

    document.body.classList.add("cursor-on");

    addEventListener("mousemove", function(e){
      mx = e.clientX; my = e.clientY;
      if(!on){ on = true; document.body.classList.add("cur-ready"); rx = mx; ry = my; }
    }, {passive:true});
    addEventListener("mouseleave", function(){ document.body.classList.remove("cur-ready"); });
    addEventListener("mouseenter", function(){ document.body.classList.add("cur-ready"); });

    (function loop(){
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dot.style.transform  = "translate(" + mx + "px," + my + "px)";
      ring.style.transform = "translate(" + rx + "px," + ry + "px)";
      requestAnimationFrame(loop);
    })();

    // grow over links and buttons, show a label over media tiles
    var mediaSel = "[data-cur]";
    var linkSel  = "a, button, input, select, textarea, label, .tl__item, .area__b";
    addEventListener("mouseover", function(e){
      var media = e.target.closest(mediaSel);
      if(media){
        ring.classList.add("is-media");
        ring.classList.remove("is-link");
        txt.textContent = media.getAttribute("data-cur") || "View";
        return;
      }
      ring.classList.remove("is-media");
      txt.textContent = "";
      ring.classList.toggle("is-link", !!e.target.closest(linkSel));
    }, {passive:true});
  })();

  /* shared rAF-throttled scroll bus, defined before its first use */
  var scrollFns = [], ticking = false;
  function onScroll(fn){ scrollFns.push(fn); }
  addEventListener("scroll", function(){
    if(ticking) return;
    ticking = true;
    requestAnimationFrame(function(){
      for(var i=0;i<scrollFns.length;i++){ scrollFns[i](); }
      ticking = false;
    });
  }, {passive:true});

  /* =========================================================
     2. BACK TO TOP with scroll progress ring
     ========================================================= */
  (function toTop(){
    var btn = $("#toTop"), ring = $("#toTopRing");
    var LEN = 2 * Math.PI * 25; // r=25
    ring.style.strokeDasharray = LEN;

    function paint(){
      var doc = document.documentElement;
      var max = doc.scrollHeight - innerHeight;
      var pct = max > 0 ? Math.min(1, scrollY / max) : 0;
      ring.style.strokeDashoffset = LEN * (1 - pct);
      btn.classList.toggle("on", scrollY > innerHeight * 0.75);
    }
    onScroll(paint);
    paint();

    btn.addEventListener("click", function(){
      // instant, as asked: no smooth scroll animation
      var prev = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      document.documentElement.style.scrollBehavior = prev;
      var h = $(".hdr__logo"); if(h) h.focus({preventScroll:true});
    });
  })();

  /* =========================================================
     3. HEADER: stuck state, scroll spy, mobile menu
     ========================================================= */
  (function header(){
    var hdr = $("#hdr");
    function stick(){ hdr.classList.toggle("stuck", scrollY > 60); }
    onScroll(stick);
    stick(); // set correctly on load, including a restored scroll position

    // scroll spy
    var links = $$("#navList a");
    var targets = links.map(function(a){ return document.querySelector(a.getAttribute("href")); });
    function spy(){
      var pos = scrollY + 140, cur = -1;
      for(var i=0;i<targets.length;i++){
        if(targets[i] && targets[i].offsetTop <= pos) cur = i;
      }
      links.forEach(function(a,i){
        if(i === cur) a.setAttribute("aria-current","true");
        else a.removeAttribute("aria-current");
      });
    }
    onScroll(spy);
    spy();

    // full-screen mobile menu
    var burger = $("#burger"), menu = $("#mnav"), open = false;
    function setMenu(state){
      open = state;
      menu.classList.toggle("on", state);
      burger.setAttribute("aria-expanded", String(state));
      burger.setAttribute("aria-label", state ? "Close menu" : "Open menu");
      document.body.style.overflow = state ? "hidden" : "";
      if(state){ var first = $(".mnav__list a", menu); if(first) first.focus(); }
      else burger.focus();
    }
    burger.addEventListener("click", function(){ setMenu(!open); });
    $$("a", menu).forEach(function(a){
      a.addEventListener("click", function(){ setMenu(false); });
    });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && open) setMenu(false);
    });
    // keep focus inside the open menu
    menu.addEventListener("keydown", function(e){
      if(e.key !== "Tab" || !open) return;
      var f = $$("a, button", menu).filter(function(el){ return el.offsetParent !== null; });
      if(!f.length) return;
      var first = f[0], last = f[f.length-1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    });
  })();

  /* =========================================================
     4. REVEAL ON SCROLL + number counters + line draws
     ========================================================= */
  (function reveal(){
    var items = $$("[data-rv]");
    var rails = $$("#tlRail, .how");

    function runCounters(scope){
      $$("[data-count]", scope).forEach(function(el){
        if(el.dataset.done) return;
        el.dataset.done = "1";
        var end = parseFloat(el.getAttribute("data-count"));
        var sfx = el.getAttribute("data-suffix") || "";
        var final = end.toLocaleString("en-US") + sfx;
        if(el.getAttribute("data-plain")){ el.textContent = end + sfx; return; }
        if(lessMotion){ el.textContent = final; return; }

        var t0 = null, dur = 1500;
        // Guarantee the exact number lands even if rAF is throttled or the
        // tab is backgrounded part way through the count.
        var settle = setTimeout(function(){ el.textContent = final; }, dur + 400);

        // t0 is seeded from the first rAF timestamp, never from
        // performance.now(). The two can use different time origins, and
        // mixing them makes the elapsed time negative and the count run
        // backwards past zero.
        function step(ts){
          if(t0 === null){ t0 = ts; requestAnimationFrame(step); return; }
          var p = Math.min(1, Math.max(0, (ts - t0) / dur));
          var eased = 1 - Math.pow(1 - p, 3);
          if(p < 1){
            el.textContent = Math.round(end * eased).toLocaleString("en-US") + sfx;
            requestAnimationFrame(step);
          } else {
            el.textContent = final;
            clearTimeout(settle);
          }
        }
        el.textContent = "0" + sfx;
        requestAnimationFrame(step);
      });
    }

    if(lessMotion || !("IntersectionObserver" in window)){
      items.forEach(function(el){ el.classList.add("in"); });
      rails.forEach(function(el){ el.classList.add("in"); });
      runCounters(document);
      return;
    }

    // Only now hide the content, so a failure above leaves everything visible.
    document.documentElement.classList.add("rv-armed");

    // Safety net: if anything stops the observer, show all of it.
    var net = setTimeout(function(){
      items.forEach(function(el){ el.classList.add("in"); });
      rails.forEach(function(el){ el.classList.add("in"); });
      runCounters(document);
    }, 5000);
    addEventListener("pagehide", function(){ clearTimeout(net); });

    var io = new IntersectionObserver(function(ents){
      ents.forEach(function(en){
        if(!en.isIntersecting) return;
        en.target.classList.add("in");
        runCounters(en.target);
        io.unobserve(en.target);
      });
    }, {rootMargin:"0px 0px -10% 0px", threshold:.12});

    // stagger siblings so grids come in one after another
    var seen = new Map();
    items.forEach(function(el){
      var p = el.parentElement;
      var n = seen.get(p) || 0;
      seen.set(p, n + 1);
      el.style.transitionDelay = Math.min(n, 5) * 80 + "ms";
      io.observe(el);
    });
    rails.forEach(function(el){ io.observe(el); });

  })();

  /* =========================================================
     4b. HERO QUICK-PRICE WIDGET
     ========================================================= */
  (function quickPrice(){
    var out = $("#qpOut"), chips = $$(".qp__chip");
    if(!out) return;

    var data = [
      {
        line:"A snapped spring is the one that leaves the door dead. The opener only guides the door, the springs carry the weight.",
        cur:"$", amt:"175", unit:"per spring, plus $99 labour"
      },
      {
        line:"Motor runs but nothing moves, or the remote quit. We test the gear, the board and the safety eyes before quoting.",
        cur:"$", amt:"129", unit:"starting, diagnosis included"
      },
      {
        line:"Grinding, banging or a door that shakes on the way up is usually worn rollers and loose hardware.",
        cur:"$", amt:"89", unit:"tune-up, rollers extra"
      },
      {
        line:"A roller off the rail or a frayed cable leaves the door crooked. Stop using the opener and call us.",
        word:"Quoted on the phone", unit:"depends on the damage"
      },
      {
        line:"When the panels are bent past repair, a new door is the cheaper answer. You get the model number in writing.",
        cur:"$", amt:"949", unit:"installed, from"
      }
    ];

    function render(i){
      var d = data[i];
      var price = d.word
        ? '<span class="qp__word">' + d.word + '</span>'
        : '<span class="qp__cur">' + d.cur + '</span><span class="qp__amt">' + d.amt + '</span>';
      out.classList.remove("swap");
      void out.offsetWidth; // restart the entry animation
      out.classList.add("swap");
      out.innerHTML =
        '<p class="qp__line">' + d.line + '</p>' +
        '<p class="qp__price">' + price + '<span class="qp__unit">' + d.unit + '</span></p>' +
        '<div class="qp__act">' +
          '<a class="btn" href="tel:+14808211111">Call 480-821-1111' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>' +
          '<a class="qp__text" href="sms:+14808211111">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4-.9L3 21l1.9-4.1A8.4 8.4 0 0 1 4 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg>' +
            'Text us a photo of the door</a>' +
        '</div>';
    }

    chips.forEach(function(c,i){
      c.addEventListener("click", function(){
        chips.forEach(function(o){ o.setAttribute("aria-pressed","false"); });
        c.setAttribute("aria-pressed","true");
        render(i);
      });
    });
    render(0); // broken spring is preselected so the card is never empty
  })();

  /* =========================================================
     4c. DOOR ANATOMY
     ========================================================= */
  (function anatomy(){
    var tabsBox = $("#anatTabs"), panel = $("#anatPanel");
    if(!tabsBox || !panel) return;

    var parts = [
      {
        id:"spring", name:"Torsion spring", hint:"Above the opening",
        icon:'<path d="M4 6v12M20 6v12M4 9h16M4 12h16M4 15h16"/>',
        does:"Wound steel that counterbalances the weight of the door. It does the lifting, not the opener.",
        signs:["A loud bang from the garage, then the door will not lift","A visible gap in the coil above the door","The opener strains or trips straight back"],
        safe:"no",
        safeTxt:"Do not run the opener and do not try to lift it by hand. A loaded spring holds enough force to injure you.",
        cur:"$", amt:"175", unit:"per spring, plus $99 labour"
      },
      {
        id:"cables", name:"Cables and drums", hint:"Each side of the shaft",
        icon:'<circle cx="12" cy="7" r="4"/><path d="M12 11v10M9 21h6M8 5.5 5 4M16 5.5 19 4"/>',
        does:"Steel cables wind onto the drums at each end of the shaft and carry the door evenly up and down.",
        signs:["One side of the door sits lower than the other","Frayed or slack cable hanging near the track","The door jerks or twists as it moves"],
        safe:"no",
        safeTxt:"Stop using the door. A cable under load can snap, and the door can come down on one side.",
        word:"Quoted on the phone", unit:"depends on the damage"
      },
      {
        id:"rollers", name:"Rollers and track", hint:"Vertical rails",
        icon:'<path d="M4 3v18M20 3v18"/><circle cx="12" cy="12" r="4.2"/><path d="M12 7.8V4M12 20v-3.8"/>',
        does:"The rollers ride inside the track and keep the door square as it travels.",
        signs:["Grinding or rattling on the way up","A roller sitting outside the rail","The door is crooked or catches halfway"],
        safe:"care",
        safeTxt:"If it is only noisy, a tune-up will do. If a roller has jumped the rail, unplug the opener and leave the door where it is.",
        cur:"$", amt:"89", unit:"tune-up flat, rollers extra"
      },
      {
        id:"opener", name:"Opener", hint:"Ceiling unit and rail",
        icon:'<rect x="3" y="8" width="18" height="9" rx="2"/><path d="M12 8V4M9 21h6"/>',
        does:"The motor that drives the trolley along the rail. It guides the door, the springs carry the weight.",
        signs:["Motor hums or clicks but the door stays put","Remote or wall button stopped working","The trolley has come away from the arm"],
        safe:"care",
        safeTxt:"Check the sensors near the floor first. If those are fine, stop cycling it so you do not cook the motor.",
        cur:"$", amt:"129", unit:"starting, diagnosis included"
      },
      {
        id:"sensors", name:"Safety sensors", hint:"Near the floor",
        icon:'<circle cx="12" cy="12" r="3"/><path d="M2 12h4m12 0h4M12 2v4m0 12v4"/>',
        does:"A pair of eyes across the opening. Break the beam and the door refuses to close.",
        signs:["Door starts down then reverses straight back","A sensor light is off or blinking","Something is parked in the beam, or an eye is knocked out of line"],
        safe:"ok",
        safeTxt:"Safe to use. Never disable the sensors to force the door shut, they are what stops it closing on something.",
        cur:"$", amt:"129", unit:"part of an opener call"
      },
      {
        id:"seal", name:"Bottom seal", hint:"Along the floor edge",
        icon:'<path d="M3 17h18M5 17V9a7 7 0 0 1 14 0v8M3 21h18"/>',
        does:"The rubber strip along the bottom edge that closes the gap against the slab.",
        signs:["Daylight under a closed door","Dust, water or scorpions getting in","The rubber is split, flattened or brittle"],
        safe:"ok",
        safeTxt:"Safe to use. It is a comfort and pest problem rather than a safety one.",
        word:"Quoted on the phone", unit:"usually under an hour"
      }
    ];

    var safeIcon = {
      no:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
      care:'<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
      ok:'<path d="m5 13 4 4L19 7"/>'
    };
    var safeLead = { no:"Not safe to use.", care:"Use with care.", ok:"Safe to use." };

    function esc(s){ return s.replace(/[&<>]/g,function(m){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[m]; }); }

    // build the tab list from the same data the panel uses
    tabsBox.innerHTML = parts.map(function(p,i){
      return '<button class="anat__tab" type="button" role="tab" aria-controls="anatPanel" ' +
        'aria-selected="' + (i === 0 ? "true" : "false") + '" data-tab="' + p.id + '">' +
        '<span class="aic"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" ' +
        'stroke="currentColor" stroke-width="1.9">' + p.icon + '</svg></span>' +
        '<span><b>' + esc(p.name) + '</b><small>' + esc(p.hint) + '</small></span></button>';
    }).join("");

    var tabs = $$(".anat__tab", tabsBox);
    var hots = $$(".anat__hot");
    var stage = $(".anat__stage");

    function select(id){
      var i = 0;
      parts.forEach(function(p,n){ if(p.id === id) i = n; });
      var d = parts[i];

      tabs.forEach(function(t){ t.setAttribute("aria-selected", String(t.getAttribute("data-tab") === id)); });
      hots.forEach(function(h){ h.setAttribute("aria-selected", String(h.getAttribute("data-hot") === id)); });
      $$(".part", stage).forEach(function(g){ g.classList.toggle("lit", g.getAttribute("data-part") === id); });

      var cost = d.word
        ? '<span class="w">' + esc(d.word) + '</span><span class="u">' + esc(d.unit) + '</span>'
        : '<span class="c">' + d.cur + '</span><span class="a">' + d.amt + '</span>' +
          '<span class="u">' + esc(d.unit) + '</span>';

      panel.classList.remove("swap");
      void panel.offsetWidth;
      panel.classList.add("swap");
      panel.innerHTML =
        '<h3>' + esc(d.name) + '</h3>' +
        '<p class="anat__does">' + esc(d.does) + '</p>' +
        '<p class="anat__sub">Signs it is going</p>' +
        '<ul class="anat__signs">' + d.signs.map(function(s){
          return '<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg><span>' + esc(s) + '</span></li>';
        }).join("") + '</ul>' +
        '<p class="anat__safe ' + d.safe + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + safeIcon[d.safe] + '</svg>' +
          '<span><strong>' + safeLead[d.safe] + '</strong> ' + esc(d.safeTxt) + '</span></p>' +
        '<p class="anat__cost">' + cost + '</p>' +
        '<a class="btn" href="#quote">Get this fixed' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>';
    }

    tabs.forEach(function(t){
      t.addEventListener("click", function(){ select(t.getAttribute("data-tab")); });
    });
    hots.forEach(function(h){
      var id = h.getAttribute("data-hot");
      h.addEventListener("click", function(){ select(id); });
      h.addEventListener("mouseenter", function(){ select(id); });
      h.addEventListener("keydown", function(e){
        if(e.key === "Enter" || e.key === " "){ e.preventDefault(); select(id); }
      });
    });

    select("spring");
  })();

  /* =========================================================
     5. TIMELINE highlight
     ========================================================= */
  $$(".tl__item").forEach(function(li){
    li.addEventListener("mouseenter", function(){
      $$(".tl__item").forEach(function(o){ o.classList.remove("on"); });
      li.classList.add("on");
    });
  });

  /* =========================================================
     6. PROMISE CARDS (expand on click, also open on hover)
     ========================================================= */
  $$(".prom__c").forEach(function(c){
    c.addEventListener("click", function(){
      var open = c.getAttribute("aria-expanded") === "true";
      $$(".prom__c").forEach(function(o){ o.setAttribute("aria-expanded","false"); });
      c.setAttribute("aria-expanded", open ? "false" : "true");
    });
  });

  /* =========================================================
     7. SYMPTOM CHECKER
     ========================================================= */
  (function symptoms(){
    var data = [
      {
        t:"The door will not open at all",
        cause:"Nine times out of ten this is a broken torsion spring. The opener is only built to guide the door, the springs carry the weight, so when one snaps the motor cannot lift it. Look at the shaft above the door: a gap in the coil means the spring has gone.",
        safe:"no",
        safeTxt:"Do not keep pressing the button. Running the opener against a dead spring burns out the motor and can drop the door.",
        chips:["Usually a spring","Same-day fix","From $175 per spring"]
      },
      {
        t:"Loud bang or grinding noise",
        cause:"A single loud bang from the garage is almost always a spring letting go, and people often mistake it for something falling over. A continuous grinding is different: that is usually worn rollers or a stripped opener gear.",
        safe:"care",
        safeTxt:"If it was one bang, treat the door as unsafe and leave it closed. If it is a grinding noise, stop using the door until it has been looked at.",
        chips:["Spring or rollers","Tune-up from $89"]
      },
      {
        t:"The door is crooked or off track",
        cause:"A roller has jumped the rail, or a lift cable has frayed and let one side drop. The door is now hanging unevenly and the remaining cable is taking more load than it was built for.",
        safe:"no",
        safeTxt:"Stop using the opener and unplug it. Every cycle bends panels further and a loaded cable can snap. Leave the door where it is.",
        chips:["Cables and rollers","Unplug the opener","Call before using"]
      },
      {
        t:"Opener clicks but nothing happens",
        cause:"A click with no movement usually means the motor is trying but the drive gear is stripped, or the trolley has disconnected from the arm. Sometimes it is the safety eyes: if they are knocked out of line the opener refuses to close and just clicks.",
        safe:"care",
        safeTxt:"Check the two sensors near the floor first, both lights should be steady. If they are fine, stop cycling the opener so you do not cook the motor.",
        chips:["Gear, trolley or sensors","Opener repair from $129"]
      },
      {
        t:"I can see a broken spring",
        cause:"A visible gap in the coil above the door means the spring has failed. The pair wears at the same rate, so the second one is usually close behind, which is why we replace both together and rebalance the door.",
        safe:"no",
        safeTxt:"Do not try to lift the door by hand or release the opener. A loaded torsion spring holds enough force to cause serious injury.",
        chips:["Replace the pair","5-year warranty","Around $449 for two"]
      }
    ];

    var out = $("#symOut"), empty = $("#symEmpty"), btns = $$(".sym__btn");
    var safeIcon = {
      no:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
      care:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
      ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>'
    };
    var safeLead = { no:"Not safe to use.", care:"Use with care.", ok:"Safe to use." };

    function esc(s){ return s.replace(/[&<>]/g, function(m){ return {"&":"&amp;","<":"&lt;",">":"&gt;"}[m]; }); }

    function show(i){
      var d = data[i];
      empty.hidden = true;
      out.hidden = false;
      out.innerHTML =
        '<h3>' + esc(d.t) + '</h3>' +
        '<p class="sym__cause">' + esc(d.cause) + '</p>' +
        '<div class="sym__safe ' + d.safe + '">' + safeIcon[d.safe] +
          '<span><strong>' + safeLead[d.safe] + '</strong> ' + esc(d.safeTxt) + '</span></div>' +
        '<div class="sym__meta">' + d.chips.map(function(c){
            return '<span class="sym__chip">' + esc(c) + '</span>';
          }).join("") + '</div>' +
        '<div class="sym__act">' +
          '<a class="btn" href="tel:+14808211111">Call 480-821-1111' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>' +
          '<a class="btn btn--dark" href="#quote">Get a free estimate' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>' +
        '</div>';
    }

    btns.forEach(function(b,i){
      b.addEventListener("click", function(){
        btns.forEach(function(o){ o.setAttribute("aria-selected","false"); });
        b.setAttribute("aria-selected","true");
        show(i);
      });
    });
  })();

  /* =========================================================
     8. PRICING selector + spring estimator
     ========================================================= */
  (function pricing(){
    var data = [
      {
        badge:"Most common",
        title:"Spring replacement",
        blurb:"Torsion or extension. We replace both springs together and rebalance the door.",
        cur:"$", amt:"175", unit:"per spring, plus $99 labour",
        list:[
          "Five-year warranty on every spring we install",
          "Door balanced and cycle tested before we leave",
          "Common sizes stocked on the truck, so most finish same day"
        ]
      },
      {
        badge:"",
        title:"Opener repair",
        blurb:"Gear, logic board, safety sensors, or a full unit swap when that is the cheaper answer.",
        cur:"$", amt:"129", unit:"starting, diagnosis included",
        list:[
          "Repair quoted against the cost of replacement, so you can choose",
          "Safety eyes realigned and tested",
          "Remotes and keypad reprogrammed before we go"
        ]
      },
      {
        badge:"",
        title:"Tune-up and rollers",
        blurb:"Full service on a door that still runs but sounds like it is coming apart.",
        cur:"$", amt:"89", unit:"flat, rollers extra",
        list:[
          "Hardware tightened and hinges lubricated",
          "Door rebalanced on the springs",
          "21-point safety check"
        ]
      },
      {
        badge:"",
        title:"New door install",
        blurb:"Steel, insulated and carriage-house styles, measured and fitted.",
        cur:"$", amt:"949", unit:"installed, from",
        list:[
          "Written quote with the model number on it",
          "Old door hauled away",
          "Manufacturer warranty registered in your name"
        ]
      }
    ];

    var panel = $("#prPanel"), tabs = $$(".pr__tab");

    function render(i){
      var d = data[i];
      panel.innerHTML =
        '<div class="pr__top">' +
          (d.badge ? '<span class="pr__badge">' + d.badge + '</span>' : "") +
          '<h3>' + d.title + '</h3>' +
          '<p class="pr__blurb">' + d.blurb + '</p>' +
          '<p class="pr__fig"><span class="pr__cur">' + d.cur + '</span>' +
            '<span class="pr__amt">' + d.amt + '</span>' +
            '<span class="pr__unit">' + d.unit + '</span></p>' +
        '</div>' +
        '<ul class="pr__list">' + d.list.map(function(li){
          return '<li><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span>' + li + '</span></li>';
        }).join("") + '</ul>' +
        '<div class="pr__foot">' +
          '<a class="btn" href="tel:+14808211111">Get my price' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>' +
          '<a class="btn btn--dark" href="#quote">Request an estimate' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>' +
        '</div>';
    }

    tabs.forEach(function(t,i){
      t.addEventListener("click", function(){
        tabs.forEach(function(o){ o.setAttribute("aria-selected","false"); });
        t.setAttribute("aria-selected","true");
        render(i);
      });
    });
    render(0);

    // estimator: $175 per spring + $99 labour
    var SPRING = 175, LABOUR = 99;
    var segBtns = $$(".seg button"), total = $("#estTotal"), brk = $("#estBreak");
    function calc(n){
      var sum = SPRING * n + LABOUR;
      total.textContent = "$" + sum.toLocaleString("en-US");
      brk.textContent = n + (n === 1 ? " spring at $175" : " springs at $175 each") + ", plus $99 labour";
    }
    segBtns.forEach(function(b){
      b.addEventListener("click", function(){
        segBtns.forEach(function(o){ o.setAttribute("aria-pressed","false"); });
        b.setAttribute("aria-pressed","true");
        calc(parseInt(b.getAttribute("data-n"), 10));
      });
    });
    calc(2);
  })();

  /* =========================================================
     9. WORK: filter chips + before/after slider
     ========================================================= */
  (function work(){
    var chips = $$(".chip"), tiles = $$("#wkGrid .wk__i");
    chips.forEach(function(c){
      c.addEventListener("click", function(){
        var f = c.getAttribute("data-filter");
        chips.forEach(function(o){ o.setAttribute("aria-pressed", String(o === c)); });
        tiles.forEach(function(t){
          t.classList.toggle("hide", f !== "all" && t.getAttribute("data-job") !== f);
        });
      });
    });

    var ba = $("#ba"), range = $("#baRange");
    if(!ba || !range) return;
    function setSplit(v){ ba.style.setProperty("--split", v + "%"); }
    setSplit(range.value);
    range.addEventListener("input", function(){ setSplit(range.value); });

    // drag anywhere on the tile
    var dragging = false;
    function fromEvent(e){
      var r = ba.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var pct = Math.max(0, Math.min(100, (x / r.width) * 100));
      range.value = pct;
      setSplit(pct);
    }
    ba.addEventListener("pointerdown", function(e){
      if(e.target.closest("a")) return;
      dragging = true; ba.setPointerCapture(e.pointerId); fromEvent(e);
    });
    ba.addEventListener("pointermove", function(e){ if(dragging) fromEvent(e); });
    ba.addEventListener("pointerup", function(){ dragging = false; });
    ba.addEventListener("pointercancel", function(){ dragging = false; });
  })();

  /* =========================================================
     10. SERVICE AREAS: list highlights the map
     ========================================================= */
  (function areas(){
    var btns = $$(".area__b");
    function light(z, on){
      $$('.area__map [data-z="' + z + '"]').forEach(function(el){
        el.classList.toggle("lit", on);
      });
    }
    btns.forEach(function(b){
      var z = b.getAttribute("data-zone");
      b.addEventListener("mouseenter", function(){ light(z, true); });
      b.addEventListener("mouseleave", function(){ if(!b.classList.contains("on")) light(z, false); });
      b.addEventListener("focus", function(){ light(z, true); });
      b.addEventListener("blur", function(){ if(!b.classList.contains("on")) light(z, false); });
      b.addEventListener("click", function(){
        var was = b.classList.contains("on");
        btns.forEach(function(o){
          o.classList.remove("on");
          light(o.getAttribute("data-zone"), false);
        });
        if(!was){ b.classList.add("on"); light(z, true); }
      });
    });
  })();

  /* =========================================================
     11. TESTIMONIAL carousel: drag, arrows, progress
     ========================================================= */
  (function reviews(){
    var track = $("#rvTrack"), prev = $("#rvPrev"), next = $("#rvNext"), bar = $("#rvBar");
    if(!track) return;

    function step(){
      var card = track.querySelector(".rv__card");
      return card ? card.getBoundingClientRect().width + 22 : 300;
    }
    function paint(){
      var max = track.scrollWidth - track.clientWidth;
      var pct = max > 0 ? track.scrollLeft / max : 0;
      // thumb width mirrors how much of the rail is visible
      var w = Math.max(12, track.clientWidth / track.scrollWidth * 100);
      bar.style.width = w + "%";
      bar.style.marginLeft = (pct * (100 - w)) + "%";
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft > max - 4;
    }
    track.addEventListener("scroll", paint, {passive:true});
    addEventListener("resize", paint);
    paint();

    function go(dir){
      track.scrollBy({left: dir * step(), behavior: lessMotion ? "auto" : "smooth"});
    }
    prev.addEventListener("click", function(){ go(-1); });
    next.addEventListener("click", function(){ go(1); });

    // pointer drag
    var down = false, startX = 0, startL = 0, moved = 0;
    track.addEventListener("pointerdown", function(e){
      if(e.pointerType === "touch") return; // let native touch scrolling run
      down = true; moved = 0;
      startX = e.clientX; startL = track.scrollLeft;
      track.classList.add("drag");
    });
    addEventListener("pointermove", function(e){
      if(!down) return;
      var dx = e.clientX - startX;
      moved = Math.abs(dx);
      track.scrollLeft = startL - dx;
    });
    addEventListener("pointerup", function(e){
      if(!down) return;
      down = false;
      track.classList.remove("drag");
      // swallow the click if this was a real drag
      if(moved > 6){
        var kill = function(ev){ ev.preventDefault(); ev.stopPropagation(); };
        track.addEventListener("click", kill, {capture:true, once:true});
        setTimeout(function(){ track.removeEventListener("click", kill, true); }, 0);
      }
    });
  })();

  /* =========================================================
     12. FAQ accordion
     ========================================================= */
  $$(".faq__q").forEach(function(q){
    q.addEventListener("click", function(){
      var open = q.getAttribute("aria-expanded") === "true";
      $$(".faq__q").forEach(function(o){ o.setAttribute("aria-expanded","false"); });
      q.setAttribute("aria-expanded", open ? "false" : "true");
    });
  });

  /* =========================================================
     13. HERO video: pause offscreen, honour reduced motion
     ========================================================= */
  (function heroVideo(){
    var v = $("#heroVid");
    if(!v) return;
    if(lessMotion){ v.pause(); v.removeAttribute("autoplay"); return; }
    if(!("IntersectionObserver" in window)) return;
    new IntersectionObserver(function(ents){
      ents.forEach(function(e){
        if(e.isIntersecting) v.play().catch(function(){});
        else v.pause();
      });
    }, {threshold:.05}).observe(v);
  })();

  /* =========================================================
     14. QUOTE FORM validation
     ========================================================= */
  (function form(){
    var f = $("#quoteForm"), ok = $("#formOk");
    var rules = {
      "f-name":  function(v){ return v.trim().length >= 2; },
      "f-phone": function(v){ return v.replace(/\D/g, "").length >= 10; },
      "f-city":  function(v){ return v !== ""; }
    };
    function check(id){
      var el = $("#" + id), fld = el.closest(".fld");
      var good = rules[id](el.value);
      fld.classList.toggle("bad", !good);
      el.setAttribute("aria-invalid", good ? "false" : "true");
      if(good) el.removeAttribute("aria-describedby");
      else el.setAttribute("aria-describedby", "e-" + id.split("-")[1]);
      return good;
    }
    Object.keys(rules).forEach(function(id){
      var el = $("#" + id);
      el.addEventListener("blur", function(){ check(id); });
      el.addEventListener("change", function(){
        if(el.closest(".fld").classList.contains("bad")) check(id);
      });
    });
    f.addEventListener("submit", function(e){
      e.preventDefault();
      var bad = null;
      Object.keys(rules).forEach(function(id){
        if(!check(id) && !bad) bad = $("#" + id);
      });
      if(bad){ ok.classList.remove("on"); bad.focus(); return; }
      ok.classList.add("on");
      f.reset();
      ok.scrollIntoView({block:"nearest", behavior: lessMotion ? "auto" : "smooth"});
    });
  })();

  /* =========================================================
     15. Smooth anchor scrolling, disabled under reduced motion
     ========================================================= */
  if(!lessMotion){ document.documentElement.style.scrollBehavior = "smooth"; }
  mqMotion.addEventListener("change", function(e){
    lessMotion = e.matches;
    document.documentElement.style.scrollBehavior = e.matches ? "auto" : "smooth";
  });
})();