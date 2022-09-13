// written by weeki :-P
(() => {
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

    function v_sub(a, b)
    {
        return [a[0] - b[0], a[1] - b[1]];
    }

    function v_norm(a)
    {
        return Math.abs(Math.sqrt( a[0] * a[0] + a[1] * a[1] ));
    }

    function v_distance( a, b )
    {
        return v_norm(v_sub(a, b));
    }
    
    function linear_interp(t, pos, v1, v2)
    {
        pos = 1 - pos;
        if ( t >= 0 && t <= pos )
            return v1 + ((1/pos) * t)*(v2 - v1);
        else
           return v2;
    }

    function v_rotate(vec, angle)
    {
        return [
            vec[0] * Math.cos(angle) + vec[1] * Math.sin(angle),
            (vec[0] * -Math.sin(angle)) + vec[1] * Math.cos(angle)
        ];
    }

    function ArrowCoordinate(up, step, coords, index)
    {

        const x = v_rotate(up, step);

        //if ( index == 1 )
          //  console.log(x);


        return [
            coords[0] * x[0] + coords[1] * up[0],
            coords[0] * x[1] + coords[1] * up[1]
        ];
    }

    function getColorIndicesForCoord(x, y, width) 
    {
        const red = y * (width * 4) + x * 4;
        return [red, red + 1, red + 2, red + 3];
    }
    
    function rgbToHsv( rgb )
    {
        const [R, G, B] = rgb;

        const M = Math.max(R, G, B);
        const m = Math.min(R, G, B);

        const V = M / 255;
        const S = 1 - (m / M);

        let H = null;
        let _h = null;

        const sqrt = Math.sqrt( R*R + G*G + B*B - R*G - R*B - G*B );
        if ( sqrt <= 0 )
            _h = 0;
        else
            _h = Math.acos( ( R - (1/2) * G -  (1/2) * B ) / sqrt ) / Math.PI * 180;

        if ( G >= B )
            H = _h;
        else
            H = 360 - _h;

        return [H, S, V];
    }

    function hsvToRgb( hsv )
    {
        let [H, S, V] = hsv;

        const M = 255 * V;
        const m = M*(1 - S);

        const z = ( M - m ) * ( 1 - Math.abs( ((H / 60) % 2) - 1 ) );

        H = H % 360; // undefined fix.

        let [R, G, B] = [undefined, undefined, undefined];

        if ( H >= 0 && H < 60 )
        {
            R = M;
            G = z + m;
            B = m;
        } 
        else if ( H >= 60 && H < 120 )
        {
            R = z + m;
            G = M;
            B = m;
        }
        else if ( H >= 120 && H < 180 )
        {
            R = m;
            G = M;
            B = z + m;
        }
        else if ( H >= 180 && H < 240 )
        {
            R = m;
            G = z + m;
            B = M;
        }
        else if ( H >= 240 && H < 300 )
        {
            R = z + m;
            G = m;
            B = M;
        }
        else if ( H >= 300 && H < 360 )
        {
            R = M;
            G = m;
            B = z + m;
        }
        else
        {
            
        }

        return [R, G, B];
    }

    function desaturate(col)
    {
        const hsvCol = rgbToHsv(col);
        hsvCol[1] = 0; // Put saturation to 0;
        return hsvToRgb(hsvCol);
    }

    function col_normalize(col)
    {
        return [ col[0] / 255, col[1] / 255, col[2] / 255 ];
    }

    function col_denormalize(col)
    {
        return [col[0] * 255, col[1] * 255, col[2] * 255];
    }

    function col_mult(a, b)
    {
        return [ a[0] * b[0], a[1] * b[1], a[2] * b[2] ];
    }

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
                case 'shadow_mask':
                {
                    const buff = document.createElement('canvas');
                    const bctx = buff.getContext('2d');
                    
                    buff.width  = options.width;
                    buff.height = options.height;

                    const middlePoint = [ buff.width / 2, buff.height / 2 ];

                    const cRad1 = 1;
                    const cRad2 = options.borderWidth;

                    const xRad = buff.width / 2;
                    const yRad = buff.height / 2;
                    const radius = xRad; // to count for ellipses in the next version.

                    bctx.save();
                    bctx.translate(middlePoint[0], middlePoint[1]);
                    bctx.beginPath();
                    bctx.ellipse(0, 0, xRad, yRad, 0, 0, 2 * Math.PI);
                    bctx.fill();
                    bctx.closePath();
                    bctx.restore();
                    
                    const imgData = bctx.getImageData(0, 0, buff.width, buff.height).data;

                    const clip = (val, valToClip, greater, less) => {
                        return val > greater || val < less ? 0 : val;
                    }

                    const borderSize = radius * cRad1 - radius * cRad2;

                    for ( let x = 0; x < buff.width; ++x )
                    {
                        for ( let y = 0; y < buff.height; y++ )
                        {

                            const dFromCenter =  v_distance( middlePoint, [x + .5, y + .5] );
                            const radDifference = dFromCenter - cRad2 * radius;
                            
                            let alphaFactor = 1;
                            const ratio = radDifference / borderSize;

                            let t = clip(ratio, 0, 1, 0);
                            if ( ratio > 1 || ratio < 0 )
                                alphaFactor = 0;
                            else
                                alphaFactor = linear_interp(t, 0.2, 0, .25);
                            

                            const alphaIndex = getColorIndicesForCoord(x, y, buff.width)[3];

                            imgData[alphaIndex] = alphaFactor*255;
                        }
                    }

                    bctx.putImageData(new ImageData(imgData, buff.width, buff.height), 0, 0);
                    return buff;
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
                case 'change-color':
                {
                    // const col = rgbToHsv([216, 62, 42]);
                    const { color, texture } = options;
                    const nColor = col_normalize(color);

                    const cnv = document.createElement('canvas');
                    const ctx = cnv.getContext('2d');
                    cnv.width = texture.width;
                    cnv.height = texture.height;

                    ctx.drawImage(texture, 0, 0);

                    const imgData = ctx.getImageData(0, 0, cnv.width, cnv.height);
                    const data = imgData.data;

                    for ( let x = 0; x < cnv.width; ++x )
                    {
                        for ( let y = 0; y < cnv.height; ++y )
                        {
                            const [Ri, Gi, Bi] = getColorIndicesForCoord(x, y, cnv.width);
                            
                            const colVal = [data[Ri], data[Gi], data[Bi]];
                            const desCol = desaturate(colVal);
                            const col = col_normalize(desCol);

                            const newCol = col_denormalize( col_mult( col, nColor ) );
                            
                            data[Ri] = newCol[0];
                            data[Gi] = newCol[1];
                            data[Bi] = newCol[2];
                        }
                    }

                   ctx.putImageData(imgData, 0, 0);

                    return cnv;
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

	class BGLinesFixer extends GameObject
	{
		OnInit()
		{
			
		}
		
		update()
		{
			
		}
		
		draw()
		{
			const currCol = ctx.fillStyle;
			ctx.fillStyle = "#BF9A7F";
			ctx.save();
			
			ctx.fillRect(0, -10, canvas.width/2 - 2, 20);

			ctx.rotate(Math.PI/2);			
			ctx.fillRect(0, -10, canvas.width/2 - 2, 20);
			
			ctx.rotate(Math.PI/2);
			ctx.fillRect(0, -10, canvas.width/2 - 2, 20);
			
			ctx.rotate(Math.PI/2);
			ctx.fillRect(0, -10, canvas.width/2 - 2, 20);
			
			ctx.fillStyle = currCol;
			ctx.restore();
		}
	}
	
    class SpinButton extends GameObject
    {
        OnInit()
        {
            const res = ResourceManager.GetResource('default');
            this.button = res.getImage('35.png');
            this.buttonGrayTexture = WheelFactory.GenTexture('change-color', { texture: this.button, color: [200, 200, 200] });

            this.buffer = document.createElement('canvas');
            this.buffer.width = this.button.width;
            this.buffer.height = this.button.height;
            
            this.buffer_ctx = this.buffer.getContext('2d');
            this.luminosity = .3;

            // button things:

            this.firstTouch = false;
        }

        draw()
        {
            ctx.save();
            
            let buttonTexture = this.button;
            if ( !fortuneWheel.isEnabled() )
                buttonTexture = this.buttonGrayTexture;

            this.buffer_ctx.drawImage(buttonTexture, 0, 0);
            this.buffer_ctx.globalAlpha = this.luminosity;

            this.buffer_ctx.fillRect(0, 0, buttonTexture.width, buttonTexture.width);
            this.buffer_ctx.globalAlpha = 1;
            this.buffer_ctx.globalCompositeOperation = 'destination-in';
            this.buffer_ctx.drawImage(buttonTexture, 0, 0);
            this.buffer_ctx.globalCompositeOperation = 'source-over';
            
            // ctx.drawImage(this.buffer, -buttonTexture.width / 2, -buttonTexture.width / 2);
            ctx.drawImage(this.buffer, -buttonTexture.width / 2, -buttonTexture.width / 2);
            
            ctx.restore();
        }

        update()
        {
            if ( fortuneWheel.isEnabled() )
            {

                const mousePos = this.toParentSpace0( inputManager.mouse.pos ); // to object space
                const distance = this.button.width / 2;
    
                if ( !fortuneWheel.isSpinning )
                {
                    if ( v_norm(mousePos) <= this.button.width / 2 )
                    {
                        canvas.style.cursor = 'pointer';
                        this.luminosity = .22;
                    }
                    else
                    {
                        canvas.style.cursor = 'default';
                        this.luminosity = .3;
                    }
                    
                    if ( v_norm(mousePos) <= distance && !inputManager.mouse.down && this.firstTouch )
                    {
                        this.firstTouch = false;
                        canvas.style.cursor = 'default';
                        this.luminosity = .3;
                        fortuneWheel.spin();
                    }
                    
                    if ( v_norm(mousePos) <= distance && inputManager.mouse.down && !this.firstTouch )
                        this.firstTouch = true;
    
                    if ( v_norm(mousePos) <= distance && this.firstTouch )
                        canvas.style.cursor = 'default';
    
    
    
                    if ( !inputManager.mouse.down )
                        this.firstTouch = false;
                }
            }
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
            //ctx.drawImage(this.selectArrow, -this.selectArrow.width / 2, -this.selectArrow.height / 2);
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



            ctx.save();
            ctx.rotate(-this.angleNum * 2 * Math.PI / 8 );
            
            if ( true )
            {

                ctx.save();
                if ( this.type == 'white' )
                {
                    ctx.scale(-1, -1);
                    ctx.translate(-this.texture.width, -this.texture.height);    
                }
                else if ( this.type == 'dark' )
                {
                    ctx.scale(1, -1);
                    ctx.translate(0, -this.texture.height);    
                }

                ctx.drawImage(this.texture, 0, 0);
                
                ctx.restore();
            }
                
            ctx.restore();
        }
    }

    class WinningItemsLayer extends GameObject
    {
        constructor(defaultImg)
        {
            super();
            this.defaultImg = defaultImg;
            this.itemDistance = 112;
        }
        OnInit()
        {
            this.items = [];
            this.setDefaultItems();
        }

        setDefaultItems()
        {
            for ( let i = 0; i < 8; ++i )
                this.items[i] = {wheelIndex: i, img: this.defaultImg};
        }

        draw()
        {
            if ( fortuneWheel.isEnabled() )
            {
                for ( const item of this.items )
                {                 
                    ctx.save();
    
                    ctx.globalAlpha = .8;
                    const stepAngle = 2*Math.PI/8;
                    const angle = -stepAngle * item.wheelIndex;
                    
                    const newAngle = angle;
    
                    ctx.rotate( newAngle);
                    const arrowImg = ResourceManager.GetResource('default').getImage('11.png');
    
                    const coords = ArrowCoordinate([0, 1], stepAngle, [this.itemDistance, this.itemDistance], item.wheelIndex);
                    ctx.translate(coords[0], coords[1]);
    
                    
                    const texture = ResourceManager.GetResource('default').getImage(item.img);
                    
                    
                    ctx.rotate( -newAngle );
    
                    ctx.save();
                    const mx = ctx.getTransform();
                    // REMOVE Isometry view since winning items textures are already isometric.
                    ctx.setTransform( 1 * SCALE_FACTOR, 0, 0, 1 * SCALE_FACTOR, mx.e, mx.f );
                    ctx.drawImage(texture, -texture.width/2, -texture.height/2);
                    ctx.restore();
                
                    ctx.restore();
                }
                
                ctx.globalAlpha = 1;
            }
        }

        update()
        {

        }
    }

    class WheelDisplay extends GameObject
    {
        OnInit()
        {
            this.arrows = [];

            this.winningItemsLayer = new WinningItemsLayer('28.png');
            this.winningItemsLayer.OnInit();

            this.shadowMask = WheelFactory.GenTexture("shadow_mask", { width: 600, height: 600, borderWidth: .85 });
       

            const res = ResourceManager.GetResource('default');
            
            res.addImage('12-off', WheelFactory.GenTexture('darker', { texture: res.getImage('12.png'), opacity: .8 }));
            res.addImage('13-off', WheelFactory.GenTexture('darker', { texture: res.getImage('13.png'), opacity: .8 }));

            for ( let i = 0; i < 8; ++i )
                this.addArrow(i % 2 == 0 ? 'white' : 'dark', i, i);
        }

        getWinningItemsLayer()
        {
            return this.winningItemsLayer;
        }

        updateWinningItems()
        {

        }

        turnArrow(index)
        {
            if ( index === fortuneWheel.oldIndexWheelLit )
                return;

            if ( index < 0 && fortuneWheel.oldIndexWheelLit )
            {
                this.arrows[fortuneWheel.oldIndexWheelLit].lit = false;
                fortuneWheel.oldIndexWheelLit = undefined;
                return;
            }

            if ( index < 0 )
                return;

            const arrow = this.arrows[index];
            arrow.lit = true;
            if ( fortuneWheel.oldIndexWheelLit !== undefined )
                this.arrows[fortuneWheel.oldIndexWheelLit].lit = false;
                fortuneWheel.oldIndexWheelLit = index;
        }

        addArrow(type, angleNum, angleId)
        {
            const arrow = new Arrow(type, angleNum, angleId);
            this.arrows.push(arrow);
            arrow.OnInit();
        }

        update()
        {
            for ( const arrow of this.arrows )
                arrow.update();

            this.winningItemsLayer.update();

            if ( fortuneWheel.isSpinning )
               this.turnArrow( fortuneWheel.getSpinningIndex() );
            else
                this.turnArrow( -1 );        
        }

        draw()
        {
            for ( const arrow of this.arrows )
                arrow.draw();

            this.winningItemsLayer.draw();

            ctx.drawImage(this.shadowMask, -this.shadowMask.width/2, -this.shadowMask.width/2);

            
        }
    }

    class FortuneWheel
    {
        constructor()
        {
            this.components = {
				'background-wheel-fixer': new BGLinesFixer(),
                'wheel-display': new WheelDisplay(),
                'spin-button': new SpinButton(),
                'top-layer': new TopLayer()
            };

            this.wheelTexture = undefined;
            this.matrix = new DOMMatrix([1, -1/2, 0, 1, canvas.width / 2, canvas.height / 2]);

            this.oldIndexWheelLit = undefined;
            this.indexWheelSlice = 0;
            this.spinningValue = 0;
            this.isSpinning = false;
            this.spinningDuration = 5; // 5 seconds
            this.nextTime = 0;
            
            this.winningItems = [];
            this.enabled = false;

            
            this.loadWinningItem();
        }

        isEnabled()
        {
            return this.enabled;
        }

        loadWinningItem()
        {

        }

        onWinningItemsLoaded()
        {
            this.components['wheel-display'].getWinningItemsLayer().updateWinningItems();
        }

        spin()
        {
            this.nextTime = currentTime + 5000;
            this.isSpinning = true;
        }

        stopSpinning()
        {
            this.isSpinning = false;
        }
        
        getSpinningValue()
        {
            const currSec = (1 - ((this.nextTime - currentTime) / (this.spinningDuration * 1000))) * this.spinningDuration;

            const value = 0;
 
            
            return currSec * 14;
        }

        getSpinningIndex()
        {

            return Math.floor( this.getSpinningValue() ) % 8;
        }


        getComponent(cName)
        {
            return this.components[cName];
        }

        OnInit()
        {
            this.wheelTexture = WheelFactory.GenTexture('stone-wheel');
            this.scaleFactor = SCALE_FACTOR;
            if ( VIEW_MODE === 'isometric' )
                this.matrix = new DOMMatrix([this.scaleFactor * 1, - this.scaleFactor * 1/2, 0, this.scaleFactor * 1, canvas.width / 2, canvas.height / 2]);
            else
                this.matrix = new DOMMatrix([this.scaleFactor * 1, 0, 0, this.scaleFactor * 1, canvas.width / 2, canvas.height / 2]);

            for ( const cmp in this.components )
            {
                this.components[cmp].OnInit();
                this.components[cmp].setParentMatrix( this.matrix );
            }
            
            // this.spin();
        }

        draw()
        {
            ctx.save();
            ctx.setTransform(this.matrix);

            
			ctx.save();
			ctx.scale(.99, .99);
            ctx.drawImage(this.wheelTexture, -this.wheelTexture.width/2, -this.wheelTexture.height/2);
            ctx.restore();
			
            for ( const cmp in this.components )
                this.components[cmp].draw();
            
            ctx.restore();
        }

        update()
        {
            if ( this.isSpinning )
            {
                if ( currentTime > this.nextTime )
                    this.stopSpinning()
            }

            for ( const cmp in this.components )
                this.components[cmp].update();
        }
    }

    const SCALE_FACTOR = .75; // .68 for isometric .75 for front
    const VIEW_MODE = 'front';
    const canvas = document.createElement('canvas');
    const ctx   = canvas.getContext('2d');
    const fortuneWheel = new FortuneWheel();

    let inputManager = {
        mouse: {
            down: false,
            pos: [undefined, undefined]
        }
    };

    let currentTime = 0;

    canvas.addEventListener('mousemove', (e) => {
        inputManager.mouse.pos[0] = e.offsetX;
        inputManager.mouse.pos[1] = e.offsetY;
    });
    
    canvas.addEventListener('mousedown', (e) => {
        inputManager.mouse.down = true;
    });
    
    canvas.addEventListener('mouseup', (e) => {
        inputManager.mouse.down = false;
    });
    
    ResourceManager.resources = {
        'default': new SpriteSheet('resources')
    };
    
    const windowSize = { width: 572, height: 500 };
    
    resizeCanvas(canvas, windowSize);
    init();

    document.querySelector('#fortune-wheel').appendChild(canvas);
})();