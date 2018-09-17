// 1. Enable shadow mapping in the renderer. 
// 2. Enable shadows and set shadow parameters for the lights that cast shadows. 
// Both the THREE.DirectionalLight type and the THREE.SpotLight type support shadows. 
// 3. Indicate which geometry objects cast and receive shadows.

var renderer = null, 
scene = null, 
camera = null,
root = null,
raptor = null,
monster = null,
group = null,
orbitControls = null;

var mixers = [];

var objLoader = null, mtlLoader = null, fbxLoader = null;

//var duration = 20000; // ms
var duration = 10, // sec
raptorAnimator = null;

var currentTime = Date.now();
var clock = new THREE.Clock();

function loadObjAndMtl()
{
    if(!mtlLoader)
        mtlLoader = new THREE.MTLLoader();

    mtlLoader.setPath("../models/Velociraptor/")
    mtlLoader.load(
        'raptor.mtl',

        function(materials) {
            materials.preload();

            if(!objLoader)
                objLoader = new THREE.OBJLoader();

            objLoader.setMaterials(materials);
            objLoader.load(
                '../models/Velociraptor/raptor.obj',

                function(object)
                {

                    object.traverse( function ( child ) 
                    {
                        if ( child instanceof THREE.Mesh ) 
                        {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    } );
                            
                    raptor = object;
                    raptor.scale.set(3,3,3);
                    //raptor.position.z = -3;
                    raptor.position.y = -4;
                    //raptor.rotation.y = Math.PI / 2;
                    scene.add(raptor);
                    playAnimations();
                },
                function ( xhr ) {

                    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            
                },
                // called when loading has errors
                function ( error ) {
            
                    console.log( 'An error happened' );
            
                });
        }
    );
}

function loadFBX() {
    fbxLoader = new THREE.FBXLoader();
    fbxLoader.load( '../models/human/BaseMesh_Anim.fbx', function ( object ) {

        //var texture = new THREE.TextureLoader().load('../models/wolf/textures/Wolf_Body.jpg');

        object.mixer = new THREE.AnimationMixer( object );
        mixers.push( object.mixer );

        var action = object.mixer.clipAction( object.animations[ 0 ] );
        action.play();
        object.traverse( function ( child ) {

            if ( child.isMesh ) {
                child.castShadow = true;
                //child.map = texture;
                child.receiveShadow = true;
            }
        });

        raptor = object;
        raptor.scale.set(0.05, 0.05, 0.05);
        raptor.rotation.x -= Math.PI / 2;
        //raptor.position.z = -3;
        raptor.position.y = -4;
        scene.add( raptor );
        playAnimations();

    },
    function ( xhr ) {

        console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            
    },
    // called when loading has errors
    function ( error ) {        
        console.log( 'An error happened: ' + error );
    });
}

function run()
{
    requestAnimationFrame(function() { run(); });

        if ( mixers.length > 0 ) {
            for ( var i = 0; i < mixers.length; i ++ ) {
                mixers[ i ].update( clock.getDelta() );
            }
        }
    
        // Render the scene
        renderer.render( scene, camera );

        // Update the animations
        KF.update();

        // Update the camera controller
        orbitControls.update();
}

function setLightColor(light, r, g, b)
{
    r /= 255;
    g /= 255;
    b /= 255;
    
    light.color.setRGB(r, g, b);
}

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "../images/checker_large.gif";

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas) {
    
    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(-2, 6, 12);
    scene.add(camera);
    
    // Create a group to hold all the objects
    root = new THREE.Object3D;
    
    // Add a directional light to show off the object
    directionalLight = new THREE.DirectionalLight( 0xffffff, 1);

    // Create and add all the lights
    directionalLight.position.set(.5, 0, 3);
    root.add(directionalLight);

    spotLight = new THREE.SpotLight (0xffffff);
    spotLight.position.set(2, 8, 15);
    spotLight.target.position.set(-2, 0, -2);
    root.add(spotLight);

    spotLight.castShadow = true;

    spotLight.shadow.camera.near = 1;
    spotLight.shadow. camera.far = 200;
    spotLight.shadow.camera.fov = 45;
    
    spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight ( 0x888888 );
    root.add(ambientLight);
    
    // Create the objects
    // If you want to change to the raptor just remove the comment in the following line and add a comment to loadFBX()
    //loadObjAndMtl();
    loadFBX();

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Create a texture map
    var map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    var color = 0xffffff;

    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;
    
    // Add the mesh to our group
    group.add( mesh );
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    
    // Now add the group to our scene
    scene.add( root );
}

function playAnimations() {

    console.log(raptor);

    if (raptor){

        if (raptorAnimator)
            raptorAnimator.Stop();

        console.log("Si entra");

        raptorAnimator = new KF.KeyFrameAnimator;
            raptorAnimator.init({ 
                interps:
                    [
                        { 
                            keys:[0, 1], 
                            values:[
                                    { z : Math.PI / 2 },
                                    { z : 5 * Math.PI / 2},
                                    ],
                            target:raptor.rotation
                        },
                        {
                            keys:[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
                            values:[
                                    { x : 5 * Math.cos(-Math.PI / 2), z : -5 * Math.sin(-Math.PI / 2) - 5 },
                                    { x : 5 * Math.cos(-Math.PI / 4), z : -5 * Math.sin(-Math.PI / 4) - 5 },
                                    { x : 5 * Math.cos(0), z : -5 * Math.sin(0) - 5},
                                    { x : 5 * Math.cos(Math.PI / 4), z : -5 * Math.sin(Math.PI / 4) - 5},
                                    { x : 5 * Math.cos(Math.PI / 2), z : -5 * Math.sin(Math.PI / 2) - 5},
                                    { x : 5 * Math.cos(3 * Math.PI / 4), z : -5 * Math.sin(3 * Math.PI / 4) - 5},
                                    { x : 5 * Math.cos(Math.PI), z : -5 * Math.sin(Math.PI) - 5},
                                    { x : 5 * Math.cos(5 * Math.PI / 4), z : -5 * Math.sin(5 * Math.PI / 4) - 5},
                                    { x : 5 * Math.cos(3 * Math.PI / 2), z : -5 * Math.sin(3 * Math.PI / 2) - 5},
                                    ],
                            target:raptor.position
                        },
                    ],
                loop: true,
                duration:duration * 1000,
            });
            raptorAnimator.start();
    }
}