//contenuto da utils.js
// Preload images
const preloadImages = (selector = 'img') => {
    return new Promise((resolve) => {
        imagesLoaded(document.querySelectorAll(selector), {background: true}, resolve);
    });
};


//contenuto content.js
// The Content class handles the pixelation effect
class Content {
	// DOM elements
	DOM = {
		el: null,
		canvasWrap: null,
		canvas: null,
		inner: null
	};
	// the image source/url
	imageSrc;
	// canvas image
	img;
	// the image ratio
	imgRatio;
	// canvas context
	ctx;
	// The pixelation factor values determine the level of 
	// pixelation at each step of the effect.
	// To make the effect more prominent, we start with 
	// smaller values initially to keep the big blocks 
	// visible for a longer time.
	// Towards the end we don't add many values as 
	// we want the sharpening up to happen quickly here.
	pxFactorValues = [1, 2, 4, 9, 100];
	pxIndex = 0;

	/**
	 * Constructor for the Content class.
	 * Accepts a DOM element representing the content element.
	 */
	// Modifica del costruttore per utilizzare <img> invece di background-image
	constructor(DOM_el) {
		// Inizializzazione degli elementi DOM
		this.DOM.el = DOM_el;
		this.DOM.canvasWrap = this.DOM.el.querySelector('.canvas-wrap');
		this.DOM.inner = this.DOM.el.querySelector('.content__inner');

		// Trova l'elemento <img> e usa il suo src come sorgente immagine
		const imgElement = this.DOM.canvasWrap.querySelector('.canvas-img');
		this.imageSrc = imgElement.src;

		// Creazione dell'elemento canvas e aggiunta alla canvasWrap
		this.DOM.canvas = document.createElement('canvas');
		this.DOM.canvasWrap.appendChild(this.DOM.canvas);

		// Ottieni il contesto 2D del canvas
		this.ctx = this.DOM.canvas.getContext('2d');

		// Crea un oggetto Image e carica la sorgente dell'immagine
		this.img = new Image();
		this.img.src = this.imageSrc;

		// Una volta che l'immagine è caricata, calcola e renderizza
		this.img.onload = () => {
			const imgWidth = this.img.width;
			const imgHeight = this.img.height;
			this.imgRatio = imgWidth / imgHeight;
			this.setCanvasSize();
			this.render();
			// Imposta gli eventi
			this.initEvents();
		};
	}


	/**
	 * Sets up event listeners and the GSAP scroll triggers.
	 * Handles resize events and triggers the pixelation 
	 * effect when the image enters the viewport.
	 */
	initEvents() {
		// Resize event handler
		window.addEventListener('resize', () => {
			this.setCanvasSize();
			this.render();
		});

		// Trigger pixelation effect when reaching the 
		// specific starting point:
		ScrollTrigger.create({
			trigger: this.DOM.el,
			start: 'top+=20% bottom',
			onEnter: () => {
				this.animatePixels();
			},
			once: true
		});

		// Add parallax effect to titles
		gsap.timeline({
			scrollTrigger: {
				trigger: this.DOM.el,
				start: 'top bottom',
				end: 'bottom top',
				scrub: true
			}
		})
		.to(this.DOM.inner, {
			ease: 'none',
			yPercent: -100
		});

		// show canvasWrap when the element enters the viewport
        ScrollTrigger.create({
            trigger: this.DOM.el,
            start: 'top bottom',
            onEnter: () => {
                gsap.set(this.DOM.canvasWrap, {
                    opacity: 1
                })
            },
            once: true
        });
	}

	/**
	 * Sets the canvas size based on the dimensions 
	 * of the canvasWrap element.
	 */
	setCanvasSize() {
		this.DOM.canvas.width = this.DOM.canvasWrap.offsetWidth;
		this.DOM.canvas.height = this.DOM.canvasWrap.offsetHeight;
	}

	/**
	 * Renders the image on the canvas.
	 * Applies the pixelation effect based on the pixel factor.
	 */
	render() {
		const offsetWidth = this.DOM.canvasWrap.offsetWidth;
		const offsetHeight = this.DOM.canvasWrap.offsetHeight;
		// increase a bit to not have a gap in the end of the image
		// when we have big pizel sizes
		const w = offsetWidth + offsetWidth * 0.05;
		const h = offsetHeight + offsetHeight * 0.05;

		// Calculate the dimensions and position for rendering the image 
		// within the canvas based on the image aspect ratio.
		let newWidth = w;
		let newHeight = h;
		let newX = 0;
		let newY = 0;

		// Adjust the dimensions and position if the image 
		// aspect ratio is different from the canvas aspect ratio
		if (newWidth / newHeight > this.imgRatio) {
			newHeight = Math.round(w / this.imgRatio);
			// let's keep Y at 0 because we want the pixels to not
			// be cut off at the top. Uncomment if you want the 
			// image to be centered.
			// newY = (h - newHeight) / 2; 
		} else {
			newWidth = Math.round(h * this.imgRatio);
			newX = (w - newWidth) / 2;
		}

		// Get the pixel factor based on the current index
		let pxFactor = this.pxFactorValues[this.pxIndex];
		const size = pxFactor * 0.01;

		// Turn off image smoothing to achieve the pixelated effect
		this.ctx.mozImageSmoothingEnabled = size === 1 ? true : false;
		this.ctx.webkitImageSmoothingEnabled = size === 1 ? true : false;
		this.ctx.imageSmoothingEnabled = size === 1 ? true : false;

		// Clear the canvas
		this.ctx.clearRect(0, 0, this.DOM.canvas.width, this.DOM.canvas.height);

		// Draw the original image at a fraction of the final size
		this.ctx.drawImage(this.img, 0, 0, w * size, h * size);

		// Enlarge the minimized image to full size
		this.ctx.drawImage(
			this.DOM.canvas,
			0,
			0,
			w * size,
			h * size,
			newX,
			newY,
			newWidth,
			newHeight
		);
	}

	/**
	 * Animates the pixelation effect.
	 * Renders the image with increasing pixelation factor at each step.
	 */
	animatePixels() {
		if (this.pxIndex < this.pxFactorValues.length) {
			// Increase the pixelation factor and continue animating
			setTimeout(() => {
				// Render the image with the current pixelation factor
				this.render();
				this.pxIndex++;
				this.animatePixels();
			}, this.pxIndex === 0 ? 300 : 80); // The first time should be the longest.
		} 
		else {
			this.pxIndex = this.pxFactorValues.length - 1;
		}
	}
}


// Smooth scrolling.
let lenis;
const initSmoothScrolling = () => {
	// Smooth scrolling initialization (using Lenis https://github.com/studio-freight/lenis)
	lenis = new Lenis({
		lerp: 0.1,
		smoothWheel: true,
		orientation: 'vertical',
	});
    
    lenis.on('scroll', () => ScrollTrigger.update());
	
    const scrollFn = () => {
		lenis.raf();
		requestAnimationFrame(scrollFn);
	};
	requestAnimationFrame(scrollFn);
};

// .content elements
const contentElems = [...document.querySelectorAll('.content')];
contentElems.forEach(el => new Content(el));

// smooth scrolling with Lenis
initSmoothScrolling();

// Preload images then remove loader (loading class) from body
preloadImages('.canvas-wrap').then(() => document.body.classList.remove('loading'));