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
    const canvasWrapWidth = this.DOM.canvasWrap.offsetWidth;
    const canvasWrapHeight = this.DOM.canvasWrap.offsetHeight;

    if (canvasWrapWidth > 0 && canvasWrapHeight > 0) {
        // Imposta una risoluzione più alta per mantenere la nitidezza
        const scaleFactor = 2; // Aumenta a 3x o 4x se desideri una risoluzione ancora maggiore

        this.DOM.canvas.width = canvasWrapWidth * scaleFactor;
        this.DOM.canvas.height = canvasWrapHeight * scaleFactor;

        // Imposta le dimensioni visive normali
        this.DOM.canvas.style.width = `${canvasWrapWidth}px`;
        this.DOM.canvas.style.height = `${canvasWrapHeight}px`;

        // Scala il contesto per mantenere la qualità
        this.ctx.scale(scaleFactor, scaleFactor);
    } else {
        setTimeout(() => this.setCanvasSize(), 100);
    }
}


	/**
	 * Renders the image on the canvas.
	 * Applies the pixelation effect based on the pixel factor.
	 */
	render() {
		const offsetWidth = this.DOM.canvasWrap.offsetWidth;
		const offsetHeight = this.DOM.canvasWrap.offsetHeight;
		
		// Aumenta leggermente per evitare gap sui bordi
		const w = offsetWidth + offsetWidth * 0.05;
		const h = offsetHeight + offsetHeight * 0.05;
	
		let newWidth, newHeight, newX, newY;
	
		// Calcola le dimensioni finali in base all'aspect ratio dell'immagine e al box
		if (this.imgRatio > w / h) {
			// L'immagine è più larga, quindi la facciamo coprire in larghezza
			newWidth = w;
			newHeight = w / this.imgRatio;
			newX = 0;
			newY = (h - newHeight) / 2; // Centrato verticalmente
		} else {
			// L'immagine è più alta, quindi la facciamo coprire in altezza
			newHeight = h;
			newWidth = h * this.imgRatio;
			newX = (w - newWidth) / 2; // Centrato orizzontalmente
			newY = 0;
		}
	
		// Usa il pixel factor per determinare il livello di pixelation
		let pxFactor = this.pxFactorValues[this.pxIndex];
		const size = pxFactor * 0.01;
	
		// Disattiva lo smoothing per mantenere l'effetto di pixelation
		const enableSmoothing = size === 1;
		this.ctx.imageSmoothingEnabled = enableSmoothing;
		this.ctx.mozImageSmoothingEnabled = enableSmoothing;
		this.ctx.webkitImageSmoothingEnabled = enableSmoothing;
	
		// Pulisci il canvas prima di disegnare
		this.ctx.clearRect(0, 0, this.DOM.canvas.width, this.DOM.canvas.height);
	
		// Disegna direttamente l'immagine ridotta e scalata
		this.ctx.drawImage(
			this.img, 
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