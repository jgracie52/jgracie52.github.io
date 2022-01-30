// Start Back To Top Button //
$(document).ready(function(){
  // Get the button
  toTopButton = document.getElementById("backToTopBtn");

  // When the user scrolls down 20px from the top of the document, show the button
  window.onscroll = function() {scrollFunction(toTopButton)};
});

function scrollFunction(toTopButton) {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    toTopButton.style.display = "block";
  } else {
    toTopButton.style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}
// End Back To Top Button //

// Start Slideshow Functions //
var slideIndex = 1;
timer = null;
$(document).ready(function(){
  showDivs(slideIndex);
});

function plusDivs(n) {
  clearTimeout(timer);
  showDivs(slideIndex += n);
}

function currentDiv(n) {
  clearTimeout(timer);
  showDivs(slideIndex = n);
}

function showDivs(n) {
  var i;
  var x = document.getElementsByClassName("slides");
  var dots = document.getElementsByClassName("demo");

  if (n > x.length) {slideIndex = 1;}
  if (n < 1) {slideIndex = x.length}
  for (i = 0; i < x.length; i++) {
    x[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" btn-hovered", "");
  }
  x[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " btn-hovered";

  timer = setTimeout('plusDivs('+(1)+')', 10000); // Change image every 2 seconds
}
// End Slideshow Functions //

// Flip Card Function //
scrollElement = null;
duration = 2000;
$(document).ready(function() {  

  $('.flip-card').click(function() {
    $(this).toggleClass('hover');
  });
  scrollElement = $(".js-scroll");
  window.addEventListener('scroll', () => {
    handleScrollAnimation();
  });

  $('.slick-carousel').slick({
    dots: true,
    infinite: true,
    speed: 300,
    slidesToShow: 1,
    adaptiveHeight: true
  });

  anime({
    targets: '.greeting-content .content-left',
    translateY: [250,0],
    duration: duration
  });
  anime({
    targets: '.greeting-content .content-right',
    translateY: [250,0],
    duration: duration
  });
  anime({
    targets: '.navbar',
    translateY: [-100,0],
    duration: duration
  });
  anime({
    targets: '.head',
    translateY: [-161.86499, -171.86499],
    translateX: [-230.59003, -230.59003],
    duration: duration,
    loop: true,
    easing: 'easeInOutSine',
    direction: 'alternate',
  });

  anime({
    targets: '.head2',
    translateY: -10,
    duration: duration,
    loop: true,
    easing: 'easeInOutSine',
    direction: 'alternate',
  });
  anime({
    targets: '.head3-hair',
    translateY: [-105.86477, -115.86477],
    translateX: [-305.93035, -305.93035],
    duration: duration,
    loop: true,
    easing: 'easeInOutSine',
    direction: 'alternate',
  });
  anime({
    targets: '.edu-cap',
    translateY: [-180.35704, -190.35704],
    translateX: [-228, -228],
    duration: duration,
    loop: true,
    easing: 'easeInOutSine',
    direction: 'alternate',
  });

  blocks = $(".code-blocks");
  block_array = ["#1abc9c", "#e6e6e6", "#fff"];
  robot_blocks = $(".robot-blocks")
  robot_array = ["#1abc9c", "#ccc"];
  code_animation(robot_blocks, robot_array);
  code_animation(blocks, block_array);

  var btn_timeline = anime.timeline({
    easing: 'easeInOutSine',
    duration: duration,
    loop: true
  });
  btn_timeline.add({
    targets: '.flashy-buttons-1',
    keyframes: [
      {fill: '#FF5733'}, {fill: '#3f3d56'}]
  }).add({
    targets: '.flashy-buttons-2',
    keyframes: [
      {fill: '#FF5733'}, {fill: '#3f3d56'}]
  }, '-=400').add({
    targets: '.flashy-buttons-3',
    keyframes: [
      {fill: '#FF5733'}, {fill: '#3f3d56'}]
  }, '-=400')
});

function code_animation(blocks, array) {
  var timeline = anime.timeline({
    easing: 'easeInOutSine',
    duration: duration,
    loop: false
  }); // no loop !!
  blocks.each(function(){
    timeline
     .add({
        targets: this,
        fill: array[Math.floor(Math.random() * array.length)]
     }, Math.floor(Math.random() * (300 - 0 + 1) + 0));
  });
  timeline.complete = function() {code_animation(blocks, array);};
}

// End Flip Card Function //

const scrollOffset = -250;

const elementInView = (el, offset = 0) => {
  const elementTop = el.getBoundingClientRect().top;

  return (
    elementTop <= 
    ((window.innerHeight || document.documentElement.clientHeight) - offset)
  );
};

const displayScrollElement = (el) => {
  if(!el.classList.contains('scrolled'))
  {
    el.classList.add('scrolled');
    if(el.classList.contains('content-right')){
      anime({
        targets: el,
        translateX: [250,0],
        duration: duration
      });
    }else if(el.classList.contains('content-up')){
      anime({
        targets: el,
        translateY: [250,0],
        duration: duration
      });
    }else{
      anime({
        targets: el,
        translateX: [-250,0],
        duration: duration
      });
    }
  }
}

const handleScrollAnimation = () => {
  scrollElement.each(function(){
    if (elementInView(this, scrollOffset)) {
      displayScrollElement(this);
  }
  });
}