function ZUI( ){
    this.items = [];
    this.mousePos = [0,0];
    this.scale = .3;
    this.maxZoomOut = .3;
    this.x = this.y = 0;
    this.scaleFactor = 1.08;
    this.boundingBox = {top:0, left:0, right:0, bottom: 0, width: 0, height: 0};

    this.inFind = false;
    this.animationSpeed = 400;

    this.setMouse = function( x, y){
        this.mousePos = [x,y];
    }

    this.zoomHere = function( ){
        this.zoomTo( 0, 0, this.maxZoomOut, 400 );
    }

    this.zoomIn = function(){
        this.scale *= this.scaleFactor;

        if( this.scale > 1 ){
            this.scale = 1;
        }else{
            this.x -= (this.scaleFactor-1)*this.mousePos[0]/this.scale;
            this.y -= (this.scaleFactor-1)*this.mousePos[1]/this.scale;
        }
        this.draw();
    }

    this.zoomOut = function(){
        this.scale /= this.scaleFactor;

        if( this.scale < .01 ){
            this.scale = .01
        }else{
            this.x += (1-1/this.scaleFactor)*this.mousePos[0]/this.scale;
            this.y += (1-1/this.scaleFactor)*this.mousePos[1]/this.scale;
        }
        this.draw();
    }

    this.getLocation = function( ){
        return {"x": this.x, "y": this.y, "scale": this.scale}
    }

    this.setPanStart = function( x, y ){
        zui.panStartCoord = [x, y];
    }

    this.pan = function( x, y ){
        this.x += (x - this.panStartCoord[0])/this.scale;
        this.y += (y - this.panStartCoord[1])/this.scale;
        this.setPanStart( x, y );
        this.draw()            
    }

    this.zoomTo = function( x, y, scale, duration ){
        this.zoomTarget = {"x":x, "y":y, "scale":scale};
        this.zoomStart = this.getLocation();

        this.animationDT = 50;
        this.animationStep = 0;
        this.animationTotalSteps = duration/this.animationDT;
        this.animationOldScale = this.scale

        clearInterval( this.animationInterval );
        this.animationInterval = setInterval( function(){zui.animate()}, this.animationDT );
    }

    this.eased = function(firstNum, lastNum){
        n = this.animationStep/this.animationTotalSteps
        return ((-Math.cos(n*Math.PI)/2) + 0.5) * (lastNum-firstNum) + firstNum;
    }

    this.linear = function(firstNum, lastNum){
        n = this.animationStep/this.animationTotalSteps
        return n * (lastNum-firstNum) + firstNum;
    }

    this.animate = function(){
        oldScale = this.scale;
        this.scale = this.eased( this.zoomStart.scale, this.zoomTarget.scale );

        deltaScale = this.scale - oldScale
        s = this.zoomStart.scale
        t = this.zoomTarget.scale
        sX = this.eased( this.zoomStart.x*s, this.zoomTarget.x*t )
        sY = this.eased( this.zoomStart.y*s, this.zoomTarget.y*t )
        
        this.x = sX/this.scale
        this.y = sY/this.scale
        
        this.draw();

        this.animationStep += 1;
        if( this.animationStep > this.animationTotalSteps ) clearInterval( this.animationInterval );
    }


    this.add = function( item ){
        item.setId( "zui_"+this.items.length );
        this.items.push( item );
    }
    
    this.remove = function( item ){
      index = this.items.indexOf( item );
      // TODO: THIS IS A HACK! FIX IT.
      // It doesn't actually remove the item, it just hides it.
      $(item.main).css({display:"none"});
      $(item.name).css({display:"none"});
      item.width = 0;
      item.height = 0;
      item.x = 0;
      item.y = 0;
    }

    this.draw = function(){
        for( i in this.items ){
            this.items[i].draw( this );
        }
    }

    this.recalculateBoundingBox = function(){
      var boundingBox = { top:0, left:0, right:0, bottom: 0};
      
      $(this.items).each( function(){
        var apparent = {
          top: this.y*zui.scale,
          left: this.x*zui.scale,
          right: (this.x+this.width)*zui.scale,
          bottom: (this.y+this.height)*zui.scale,
        };

        boundingBox.top = Math.min( apparent.top, boundingBox.top );
        boundingBox.left = Math.min( apparent.left, boundingBox.left );
        boundingBox.right = Math.max( apparent.right, boundingBox.right );
        boundingBox.bottom = Math.max( apparent.bottom, boundingBox.bottom );
      })
      
      boundingBox.width = boundingBox.right-boundingBox.left;
      boundingBox.height = boundingBox.bottom-boundingBox.top;
      
      function computeScale( dimension, constraint ){
        // The .99 is to zoom out just a bit more than srictly necessary.
        return zui.maxZoomOut * dimension/constraint * .99; 
      }
      
      zui.maxZoomOut = Math.min(
        computeScale( window.innerHeight, boundingBox.bottom ),
        computeScale( window.innerWidth, boundingBox.right )
      )
      
      this.boundingBox = boundingBox;
  }
  
  
  this.findOpenLocation = function( width, height ) {    
    function isPointInsideObject( x, y, z ) {
      isXInside = x >= z.x && x <= z.x+z.width;
      isYInside = y >= z.y && y <= z.y+z.height;
      isInside = isXInside && isYInside;
      return isInside;
    }
    
    function doRectsOverlap( rectA, rectB ){
      // A inside B?
      var isTopLeftInside = isPointInsideObject( rectA.x, rectA.y, rectB );
      var isBottomRightInside = isPointInsideObject( rectA.x+rectA.width, rectA.y+rectA.height, rectB );
      var isTopRightInside = isPointInsideObject( rectA.x+rectA.width, rectA.y, rectB );
      var isBottomLeftInside = isPointInsideObject( rectA.x, rectA.y+rectA.height, rectB );
      var isAInsideB = isTopLeftInside || isBottomRightInside || isTopRightInside || isBottomLeftInside;

      // B inside A?      
      var isTopLeftInside = isPointInsideObject( rectB.x, rectB.y, rectA );
      var isBottomRightInside = isPointInsideObject( rectB.x+rectB.width, rectB.y+rectB.height, rectA );
      var isTopRightInside = isPointInsideObject( rectB.x+rectB.width, rectB.y, rectA );
      var isBottomLeftInside = isPointInsideObject( rectB.x, rectB.y+rectB.height, rectA );
      var isBInsideA = isTopLeftInside || isBottomRightInside || isTopRightInside || isBottomLeftInside;
      
      // If either is true, they overlap
      return isAInsideB || isBInsideA;     
    }
  
    function doesOverlapAnything( rect ) {

      for(var i=0;i<zui.items.length;i++){
        var overlaps = doRectsOverlap( rect, zui.items[i] );
        if( overlaps ){ return true; }
      }
      return false;
    }
        
    var dist = 0;
    var subDivide = 3;
    var padding = 100;
    width += 100;
    height += 100;

    while( 1 ){
      for( var i=0; i<=(dist-1)*subDivide; i++){
        var rect = {x:width*dist+padding, y:i*dist/subDivide*height+padding, width:width, height:height};
        if( !doesOverlapAnything( rect ) )
          return rect;

        var rect = {x:i*dist/subDivide*width+padding, y:height*dist+padding, width:width, height:height};
        if( !doesOverlapAnything( rect ) )
          return rect;
      }
      dist += 1;
    }
  
  }

}

// Function wrappers of DOOM!
// Makes them no-ops if their criteria isn't satisfied.
function _wrapFunctionIf( func, expr ){
  return function() {
    if( eval(expr) )
      return func.apply( this, arguments );
    else
      return function(){}     
  }  
}

function ifZoomedIn( func ){ return _wrapFunctionIf(func, "zui.scale == 1" ); }
function ifZoomedOut( func ){ return _wrapFunctionIf(func, "zui.scale != 1" ); }


Tab = function( div ) {
  this.main = div;
  this.img = $(div).find("img.content");
  $(div).find("img").css({ position: "relative" }) 
  this.mouseState = "up";
  
  this.startPos = {x:0, y:0};
  this.startTop = 0;
  this.startLeft = 0;
  this.realTop = 0;
  this.realLeft = 0;
  
  this.kineticScrollSpeed = null;
  
  this.mousePositions = [];
  
  var self = this;
  
  this.getCurrentTop = function() {
    var t = $(self.img).css("top");
    return parseInt( t.substr( 0, t.length - 2 ) );    
  }

  this.getCurrentLeft = function() {
    var t = $(self.img).css("left");
    return parseInt( t.substr( 0, t.length - 2 ) );    
  }

  
  this.setScroll = function( pos ) {
    var top = pos.top == null ? this.realTop : pos.top;
    var left = pos.left == null ? this.realLeft : pos.left;
    
    $(self.img).css("top", top);
    $(self.img).css("left", left);    
    this.realTop = top;
    this.realLeft = left;
    
    // Move the URL Bar
    $("#urlbar").css({
      left: left
    })
    
    
    // Background magic. This syncs it up with the dragging.
    var offsetHeight = $(self.main).height() - $(self.img).height();
    if( top > 0 ){
      var bImage = "url(gfx/ZoomOutTopOff.png)";
      if( top > 340 ) bImage = "url(gfx/ZoomOutTopOn.png)";
      
      $(this.main).css({
        "background-image": bImage,
        "backgroundPosition": "0 " + top
      });
    }
    
    else if( top < offsetHeight ){
      var bImage = "url(gfx/ZoomOutBottomOff.png)";
      if( top < offsetHeight-340 ) bImage = "url(gfx/ZoomOutBottomOn.png)";
      
      $(this.main).css({
        "background-image": bImage,
        "backgroundPosition": "0 " + (top-offsetHeight)
      });
    }

    else if( left < 0 ){
      var bImage = "url(gfx/ZoomOutRight.png)";
      if( left < -212 ){
        bImage = "url(gfx/ZoomOutRightOn.png)";
      }
      
      $(this.main).css({
        "background-image": bImage,
        "backgroundPosition": left + " 0"
      });      
    }
    else if( left > 0 ){
      $(this.main).css({
        "background-image":"url(gfx/ZoomOutLeft.png)",    
        "backgroundPosition": left + " 0"
      });      
    }
    else{
      $(this.main).css({"background-image":"none"});      
    }
  }
  
  this.animateScroll = function( pos ) {
    var top = pos.top == null? this.realTop : pos.top;
    var left = pos.left == null? this.realLeft : pos.left;
    var speed = pos.speed || "normal";
    
    $(self.img).animate({ top: top, left:left }, speed);
    this.realTop = top;
    this.realLeft = left;        
  };
  
  this.kineticScroll = function( speed ) {
    var timeStep = 5;
    
    if( typeof(speed) != "undefined" ){
      self.kineticScrollSpeed = speed;
    }
        
    if( Math.abs(self.kineticScrollSpeed) < .01 ) return;
    if( self.realTop > 0 ) return;
    if( self.realTop <  $(self.main).height() - $(self.img).height() ) return;
    
    self.setScroll( {top:self.realTop + self.kineticScrollSpeed*timeStep*5} );
    self.kineticScrollSpeed *= .93;
    
    setTimeout( function(){
      self.kineticScroll();
    }, timeStep );
  }
  
  this.mouseDown = function( e ) {
    self.mouseState = "down";
    self.startPos = {x:e.clientX, y:e.clientY };
    self.startTop = self.getCurrentTop();
    self.startLeft = self.getCurrentLeft();
    
    self.kineticScrollSpeed = 0;
    self.mousePositions = [];
    
    e.preventDefault();
  };
    
  this.mouseUp = function( e ) {
    function delayedZoomOut(){
      setTimeout( function(){
        hideUrlBar();
        self.kineticScrollSpeed = 0;
        self.animateScroll({left:0, speed:200});
        makePagesDraggable();
        zui.zoomHere();
      }, 300)
    }
    
    self.mouseState = "up";
    
    var curMouse = self.mousePositions.pop();
    var lastMouse = self.mousePositions.pop();
    if( lastMouse ){
      var xSpeed = (curMouse.y - lastMouse.y)/(curMouse.time-lastMouse.time);
      if( Math.abs(xSpeed) > .1 )
        self.kineticScroll( xSpeed );
    }

  
    var cTop = self.realTop;
    if( cTop > 0 ){      
      self.animateScroll({ top:0, speed: 200 });
      if( cTop > 300 ){
        delayedZoomOut();    
      }
    }
    
    var offsetHeight = $(self.main).height() - $(self.img).height();
    if( cTop < offsetHeight ){
      self.animateScroll({ top:offsetHeight, speed: 200 });
      if( offsetHeight - cTop > 300 ){    
        delayedZoomOut();
      }
    }
        
    var cLeft = self.realLeft;
    if( cLeft > 0 ){
      
      if( cLeft > 50 && cLeft < 300){
        self.setScroll({left:100});
        showUrlBar();
      }
      else{
        self.animateScroll({left: 0, speed: 150});
        hideUrlBar();
      }
        
      if( cLeft > 212 ){
        delayedZoomOut();
      }
    }
    
    if( cLeft < 0 ){
      self.animateScroll({left: 0, speed: 150});
      hideUrlBar();
      if( cLeft < -212 ){
        delayedZoomOut();
      }
    }

    
  };
  
  this.mouseMove = function( e ) {
    if( self.mouseState != "down" ) return;
    
    var minLateralMove = 15;
    
    var lateralMove = (self.startPos.x - e.clientX);
    var left = self.startLeft - 2*lateralMove;
    if( Math.abs(lateralMove) < minLateralMove ){ var left = self.startLeft; }
    
    self.setScroll({
      top: self.startTop - 2*(self.startPos.y - e.clientY),
      left: left
    });
    
    self.mousePositions.push({ x:e.clientX, y:e.clientY, time: new Date() });
    if( self.mousePositions.length > 4 ) self.mousePositions.shift();
  };
  
}



var ZObject = Extend.Class({
  name: "ZObject",
  initialize: function(){ /* Remember to call __init__(); */ },
  methods: {
    setId: function(id) { $(this.main).attr( "id", id ); },
    getId: function() { return $(this.main).attr("id"); },
    
    __init__: function( x, y ){
      if( !this.main ) return;
      
      $(this.main).addClass( "zwindow" ).css({
        zIndex: 2,
        position: "absolute",
      });
      
      this.main.zparent = this;
      $("body").append(this.main);
      
      this.width = $(this.main).width();
      this.height = $(this.main).height();

      this.x = x;
      this.y = y;         
    },
    zoomHere: function(){
        x = -this.x + (window.innerWidth-this.width)/2;
        y = -this.y + (window.innerHeight-this.height)/2;                
        zui.zoomTo( x, y, 1, zui.animationSpeed ); 
    },
    calcBounds: function(){
        this.cX = (this.x+zui.x)*zui.scale;
        this.cY = (this.y+zui.y)*zui.scale;
        this.cW = this.width*zui.scale;
        this.cH = this.height*zui.scale;
    },
    draw: function(){
        this.calcBounds()
    },
  }
})

var ZButton = Extend.Class({
  name: "ZButton",
  parent: ZObject,
  initialize: function( source, x, y, name ) {
    this.main = document.createElement( "div" );
    this.img = document.createElement( "img" );
    this.name = document.createElement( "h2" );
    

    this.img.src = source;
    $(this.main).width(250).height(250);
    $(this.img).css({width: "100%", height:"100%"});

    name = name.replace(/ /g, "&nbsp;");
    $(this.name).html( name );
    
    $(this.main).append(this.img).append(this.name);
    
    this.__init__( x,y );
  },
  methods:{
    draw: function(){
        this.calcBounds();
        
        $(this.main)
          .css({left: this.cX, top: this.cY})
          .width( this.cW )
          .height( this.cH )
          
        $(this.name).css({ fontSize: zui.scale*65 })        
        return true;
    } 
  }
})


var rIndex = 0;

var ZNewTab = Extend.Class({
  name: "ZNewTab",
  parent: ZButton,
  initialize: function( source, x, y, name ){
    this.ZButton_initialize( source, x, y, name );
    $(this.img).click( this.onClick );
  },
  methods: {
    onClick: function(e) {
      var place = zui.findOpenLocation( 800, 480 );
      var newTab = new ZScroll("tab_images/newtab.gif", place.x, place.y, "New Tab");
      zui.add( newTab  );
      zui.recalculateBoundingBox();
      zui.draw();
      zui.zoomHere();
      $(newTab.main).css({opacity:0})
      
      setTimeout( function(){
        $(newTab.main).animate({opacity:1}, 1500);        
      }, 200)
      setTimeout( function(){
        newTab.zoomHere();  
      }, 900);
      
      $(newTab.main).dblclick( function(){
        var images = [ "humanized.gif", "slashdot.gif", "toolness.gif", "reddit.gif" ];
        var names = ["Humanized", "Slashdot", "Toolness", "Reddit"]
        var r = rIndex;//parseInt( Math.random()*images.length );
        var navTab = new ZScroll("tab_images/" + images[r], newTab.x, newTab.y, names[r]);
        rIndex = (rIndex+1) % images.length;
        zui.add( navTab );
        navTab.zoomHere();
        
        zui.remove( newTab );        
      })      
    }
  }
})

var ZScroll = Extend.Class({
  name: "ZScroll",
  parent: ZObject,
  initialize: function( source, x, y, name ) {    
    this.main = document.createElement( "div" );
    this.main.className = "zscroll";

    // Setup div dimensions and CSS.
    $( this.main ).height( 480 ).width( 800 ).css({ overflow: "hidden" });
            
    this.img = document.createElement( "img" );
    this.img.src = source;
    this.img.className = "content";
    $(this.main).append( this.img );
        
    this.name = document.createElement( "h2" );
    $(this.name).text( name )
                .css({position: "absolute", zIndex: 10});
    $(document.body).append( this.name );
    
    this.__init__(x,y);
    
        
    $(this.main).click( ifZoomedOut(function() {
      this.zparent.zoomHere();
      makePagesUndraggable();
    }))
    
    this.theTab = new Tab( this.main );
    $(this.main).mousedown( ifZoomedIn(this.theTab.mouseDown) )
                .mouseup( ifZoomedIn(this.theTab.mouseUp) )
                .mousemove( ifZoomedIn(this.theTab.mouseMove) );
                
    
  },

  methods:{
    positionName: function(x, y){
      $(this.name).css({
        left: x+ "px",
        top: y-125*zui.scale + "px",
        fontSize: zui.scale*65,
      })      
    },
    
    draw: function(){
        this.calcBounds();
        
        $(this.main)
          .css({left: this.cX, top: this.cY})
          .width( this.cW )
          .height( this.cH )

        $(this.img)
          .css("top", this.theTab.realTop*zui.scale + "px")
          .width( this.cW )
          .height( this.img.naturalHeight*zui.scale );
        
        this.positionName( this.cX, this.cY );
        
        return true;
    } 
  }
  
})


function showUrlBar() {
  // If the URL bar element doesn't exist, make it.
  if( $("#urlbar").length == 0 ) {
    var image = document.createElement( "img" );
    image.src = "gfx/UrlBar.png";
    image.id = "urlbar";
    
    var results = document.createElement( "img" );
    results.src = "gfx/UrlResults.png";
    results.id = "urlresults";
    
    var styles = {
      position: "fixed",
      top: 0,
      right: 0,
      zIndex: 10000,
    };
    
    $(results).css(styles).hide();
    
    $(image)
      .css(styles)
      .hide()
      .mousedown( function(){
        $(results).fadeIn();
      })
    $(document.body).append( image ).append(results);
  }

  $("#urlbar:hidden").fadeIn();
}

function hideUrlBar() {
  $("#urlbar:visible").fadeOut();
  $("#urlresults:visible").fadeOut();  
}

function makePagesDraggable(){
    $(".zscroll").Draggable({
      zIndex: 1000,
      ghosting: false,
      opacity: .8,
      distance: 10,
      onStart: function(){
        this.justStarted = true;
      },

      onDrag: function( x, y ){
        if( this.justStarted ){
          this.justStarted = false;
          this.startCoord = [x,y];
        }
        this.lastCoord = [x,y];
        
        this.zparent.positionName( x, y );
      },

      onStop: function(){
        xOffset = this.lastCoord[0] - this.startCoord[0];
        yOffset = this.lastCoord[1] - this.startCoord[1];
        this.zparent.x += xOffset/zui.scale;
        this.zparent.y += yOffset/zui.scale;
     
        zui.recalculateBoundingBox();
        zui.zoomHere();
      },                 
    });
}


function makePagesUndraggable(){
    $(".zscroll").DraggableDestroy();
}

function bindActions(){
    $("html").click( function(e){
        if( e.target.tagName == "HTML" ){
            self = this.zparent;
            zui.zoomTo( 0, 0, zui.maxZoomOut, zui.animationSpeed );
        }
    })
}

function unbindActions(){
    $("html").unbind();
}


function init(){
  zui = new ZUI();

  zui.add( new ZNewTab("gfx/BigPlus.png", 200, 200, "") );
  zui.add( new ZScroll("tab_images/Bookmarks.gif", 700, 100, "Bookmarks") )

  zui.recalculateBoundingBox();
  zui.zoomHere();
  zui.draw();

  bindActions();
  makePagesDraggable();

  function doZoom(){
    if( zui.keyDown ){
      if( zui.zoomDirection == "in" ) zui.zoomIn();
      if( zui.zoomDirection == "out" ) zui.zoomOut();
      setTimeout( doZoom, 20 );
    }
  }

  $(window).keydown( function(e) {
    if( e.keyCode == 79 ){
      zui.zoomHere();
      makePagesDraggable()
      return false;
    }
  })
}