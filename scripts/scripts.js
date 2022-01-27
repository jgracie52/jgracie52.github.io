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
$(document).ready(function() {  

  $('.flip-card').click(function() {
    $(this).toggleClass('hover');
  });
  scrollElement = $(".js-scroll");
});
// End Flip Card Function //