(() => {
    class ResourceManager
    {
        static GetResource(id) {
            return ResourceManager.resources[id];
        }
    }

    class WheelFactory
    {
        static GenTexture(type, options)
        {
            const defaultRsrc = ResourceManager.GetResource('default');
            
            switch( type )
            {
                case 'wooden-wheel':
                case 'stone-wheel':
                {
                    let img = undefined;
                    
                    if ( type === 'wooden-wheel'  )
                        img = defaultRsrc.getImage('11.png');
                    else if ( type === 'stone-wheel' )
                        img = defaultRsrc.getImage('38.png');
                    
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width  = img.width * 2;
                    canvas.height = img.height * 2;
                    
                    
                    // left top
                    ctx.drawImage(img, 0, 0);

                    // right top
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.drawImage(img, -2*img.width, 0);
                    ctx.restore();

                    // left bottom
                    ctx.save();
                    ctx.scale(1, -1);
                    ctx.drawImage(img, 0, -2*img.height );
                    ctx.restore();

                    // right bottom
                    ctx.save();
                    ctx.scale(-1, -1);
                    ctx.drawImage(img, -2*img.width, -2*img.height);
                    ctx.restore();

                    return canvas;
                }
                
                case 'darker':
                {
                    const opacityOff = options.opacity;
        
                    const buff = document.createElement('canvas');
                    const buffCtx = buff.getContext('2d');

                    buff.width = options.texture.width;
                    buff.height = options.texture.height;

                    buffCtx.drawImage( options.texture, 0, 0 );

                    buffCtx.globalCompositeOperation = 'multiply';

                    buffCtx.fillStyle = 'rgb(' + opacityOff * 255 +  ',' + opacityOff * 255 +  ', ' + opacityOff * 255 +  ')';
                    buffCtx.fillRect(0, 0, options.texture.width, options.texture.height);

                    buffCtx.globalCompositeOperation = 'destination-in';
                    buffCtx.drawImage(options.texture, 0, 0);

                    return buff;
                }
            }
            
        }
    }

    class SpriteSheet
    {
        constructor( rootFolder )
        {
            this.rootFolder = rootFolder;
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');

            this.cachedImages = {};
            this.spriteSheet = undefined;
        }

        attachImage( img )
        {
            this.canvas.width = img.width;
            this.canvas.height = img.width;
            this.ctx.drawImage(img, 0, 0);
        }

        load(sheetName, onLoaded)
        {
            const image = new Image();
            const folder = this.rootFolder + '/' + sheetName;

            image.src = folder + ".png";
            image.onload = () => {
                
               this.attachImage( image );

                fetch(folder + '.json').then( e => { 
                    e.json().then(d => { 
                        this.spriteSheet = d; 
                        
                        this.cacheImages(onLoaded);
                    });
                } );
            };

        }

        cacheImages(onLoaded)
        {
            const bitmaps = [];
            for ( const frameObj in this.spriteSheet['frames'] )
            {
                const frame = this.spriteSheet['frames'][frameObj]['frame'];
                bitmaps.push(createImageBitmap(this.ctx.getImageData(frame.x, frame.y, frame.w, frame.h)));
            }

            Promise.all(bitmaps).then(imgs => {
                let i = 0;
                for ( const frameObj in this.spriteSheet['frames'] )
                    this.cachedImages[frameObj] = imgs[i++];
                
                onLoaded();
            });
        }

        getImage(imageId)
        {
            if ( !this.spriteSheet )
                return null;

            return this.cachedImages[imageId];
        }

        addImage(name, image)
        {
            this.cachedImages[name] = image;
        }
    }

    class GameObject
    {
        constructor()
        {
            this.parentMatrix = undefined;
        }

        setParentMatrix(matrix)
        {
            this.parentMatrix = matrix;
            this.inverseParentMatrix = this.parentMatrix.inverse();
        }

        toParentSpace(coords)
        {
            const point = this.parentMatrix.transformPoint(new DOMPoint(coords[0], coords[1], 0, 1));

            return [point.x, point.y];
        }
        toParentSpace0(coords)
        {
            const point = this.inverseParentMatrix.transformPoint(new DOMPoint(coords[0], coords[1], 0, 1));

            return [point.x, point.y];
        }
    }


    class SpinButton extends GameObject
    {
        OnInit()
        {
            const res = ResourceManager.GetResource('default');
            this.button = res.getImage('35.png');
            this.b = false;
        }

        draw()
        {
            ctx.save();
            ctx.drawImage(this.button, -this.button.width / 2, -this.button.height / 2);
            ctx.restore();
        }

        update()
        {
            const mousePos = this.toParentSpace0( mouseCoords );
          //  if (  )
        }
    }

    class TopLayer extends GameObject
    {
        OnInit()
        {
            const res = ResourceManager.GetResource('default');
            this.selectArrow = res.getImage('44.png');
            this.wheelImg = res.getImage('11.png');
        }

        draw()
        {
            ctx.save();
            ctx.translate(0, -this.wheelImg.height);
            ctx.rotate(0 * Math.PI / 180);
            ctx.drawImage(this.selectArrow, -this.selectArrow.width / 2, -this.selectArrow.height / 2);
            ctx.restore();
        }

        update()
        {

        }
    }

    class Arrow extends GameObject
    {
        constructor(type, angleNum, angleId)
        {
            super();

            this.type = type;
            this.angleNum = angleNum;
            this.angleId = angleId;
            this.texture = undefined;

            this.textureLit = undefined;
            this.textureOff = undefined;
            
            {
                const res = ResourceManager.GetResource('default');

                if ( this.type == 'white' )
                {
                    this.textureLit = res.getImage('12.png');
                    this.textureOff = res.getImage('12-off');
                }
                else if ( this.type == 'dark' )
                {
                    this.textureLit = res.getImage('13.png');
                    this.textureOff = res.getImage('13-off'); 
                }
            }

            this.lit = false;
        }

        OnInit()
        {
            this.texture = this.textureOff;
        }

        update()
        {
            if ( this.lit )
                this.texture = this.textureLit;
            else
                this.texture = this.textureOff;
        }

        draw()
        {

            let w = -this.texture.width;

            if ( this.type === 'dark' )
                w = 0;

            ctx.save();
            ctx.rotate(-this.angleNum * 2 * Math.PI / 8 );
            ctx.drawImage(this.texture, w, -this.texture.height);
            ctx.restore();
        }
    }

    class WheelDisplay extends GameObject
    {
        OnInit()
        {
            this.arrows = [];

            const res = ResourceManager.GetResource('default');
            
            res.addImage('12-off', WheelFactory.GenTexture('darker', { texture: res.getImage('12.png'), opacity: .8 }));
            res.addImage('13-off', WheelFactory.GenTexture('darker', { texture: res.getImage('13.png'), opacity: .8 }));

            
            let added = 0;
            for ( let i = 0; i < 4; ++i )
            {
                this.addArrow('dark', i * 2, i + added);
                this.addArrow('white', i * 2, i + 1 + added);
                added += 1;
            }

            this.oldIndexWheelLit = undefined;
            this.indexWheelSlice = 0;
            
            this.isSpinning = false;
            this.spinningValue = 0;

            this.spinningDuration = 5; // 5 seconds
            this.nextTime = 0;
        }

        spin()
        {
            this.isSpinning = true;
            this.nextTime = currentTime + 5000;
        }

        turnArrow(index)
        {
            if ( index === this.oldIndexWheelLit )
                return;

            if ( index < 0 && this.oldIndexWheelLit )
            {
                this.arrows[this.oldIndexWheelLit].lit = false;
                this.oldIndexWheelLit = undefined;
                return;
            }

            const arrow = this.arrows[index];
            arrow.lit = true;
            if ( this.oldIndexWheelLit !== undefined )
                this.arrows[this.oldIndexWheelLit].lit = false;
            this.oldIndexWheelLit = index;
        }

        addArrow(type, angleNum, angleId)
        {
            const arrow = new Arrow(type, angleNum, angleId);
            this.arrows.push(arrow);
            arrow.OnInit();
        }

        getSpinningValue()
        {
            const currSec = currentTime / this.nextTime * this.spinningDuration;
            const value = 0;

            
            return currSec * 14;
        }

        getSpinningIndex()
        {
            return Math.floor( this.getSpinningValue() ) % 8;
        }

        update()
        {
            for ( const arrow of this.arrows )
                arrow.update();


            if ( this.isSpinning )
               this.turnArrow( this.getSpinningIndex() );
            else
                this.turnArrow( -1 );        
        }

        draw()
        {
            for ( const arrow of this.arrows )
                arrow.draw();
        }
    }

    class FortuneWheel
    {
        constructor()
        {
            this.components = {
                'wheel-display': new WheelDisplay(),
                'spin-button': new SpinButton(),
                'top-layer': new TopLayer()
            };

            this.wheelTexture = undefined;
            this.matrix = new DOMMatrix([1, -1/2, 0, 1, canvas.width / 2, canvas.height / 2]);
        }

        OnInit()
        {
            this.wheelTexture = WheelFactory.GenTexture('stone-wheel');
            this.scaleFactor = .6;
            this.matrix = new DOMMatrix([this.scaleFactor * 1, - this.scaleFactor * 1/2, 0, this.scaleFactor * 1, canvas.width / 2, canvas.height / 2]);

            for ( const cmp in this.components )
            {
                this.components[cmp].OnInit();
                this.components[cmp].setParentMatrix( this.matrix );
            }

            this.components['wheel-display'].spin();
        }

        draw()
        {
            ctx.save();
            ctx.setTransform(this.matrix);

            
            ctx.drawImage(this.wheelTexture, -this.wheelTexture.width/2, -this.wheelTexture.height/2);
                        
            for ( const cmp in this.components )
                this.components[cmp].draw();
            
            ctx.restore();
        }

        update()
        {
            for ( const cmp in this.components )
                this.components[cmp].update();
        }
    }

    const canvas = document.createElement('canvas');
    const ctx   = canvas.getContext('2d');
    const fortuneWheel = new FortuneWheel();
    let mouseCoords = [undefined, undefined];
    let currentTime = 0;


    canvas.addEventListener('mousemove', (e) => {
        mouseCoords[0] = e.clientX;
        mouseCoords[1] = e.clientY;
    });
    
    ResourceManager.resources = {
        'default': new SpriteSheet('resources')
    };
    
    const windowSize = { width: 500, height: 500 };
    
    resizeCanvas(canvas, windowSize);


    init();

    function init()
    {

        ResourceManager.resources['default'].load('wheel-sh', onResourceLoaded.bind(ResourceManager.resources['default']));
    }

    function draw()
    {
        fortuneWheel.draw();
    }

    function update()
    {
        fortuneWheel.update();
    }

    function tick(time)
    {
        currentTime = time;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        draw();
        update();
        
        requestAnimationFrame(tick);
    }

    function onResourceLoaded()
    {
        fortuneWheel.OnInit();
        requestAnimationFrame(tick);
    }

    function resizeCanvas( canvas, newSize ) {
        
        let size = null;

        if ( newSize )
            size = newSize;
        else
        {
            // automatic canvas resizing:::
            size = {
                width: 900,
                height: 900
            }
        }
        
        canvas.width = size.width;
        canvas.height = size.height;
    }

    document.body.appendChild(canvas);
})();
