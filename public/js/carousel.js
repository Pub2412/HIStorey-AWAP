document.addEventListener('DOMContentLoaded', () => {
    const carousels = document.querySelectorAll('.hero-carousel');
    
    carousels.forEach(carousel => {
        const slides = carousel.querySelectorAll('.carousel-slide');
        if (slides.length <= 1) return;
        
        let currentIndex = 0;
        
        setInterval(() => {
            slides[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % slides.length;
            slides[currentIndex].classList.add('active');
        }, 4000); // 4 seconds per slide
    });
});
