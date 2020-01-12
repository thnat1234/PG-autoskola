function map1() {

    console.log("creating map1");

    var canvas = document.getElementById("renderCanvas");

    var engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true
    });
    var vehicle, scene, chassisMesh, redMaterial, blueMaterial, greenMaterial, blackMaterial;
    var wheelMeshes = [];
    var actions = {
        accelerate: false,
        brake: false,
        right: false,
        left: false
    };

    var keysActions = {
        "KeyW": 'acceleration',
        "KeyS": 'braking',
        "KeyA": 'left',
        "KeyD": 'right'
    };

    var vehicleReady = false;

    var ZERO_QUATERNION = new BABYLON.Quaternion();

    var chassisWidth = 2.3;
    var chassisHeight = .6;
    var chassisLength = 6.2;
    var massVehicle = 300;

    var wheelAxisPositionBack = -1.9;
    var wheelRadiusBack = .4;
    var wheelWidthBack = .3;
    var wheelHalfTrackBack = 1.2;
    var wheelAxisHeightBack = 0.4;

    var wheelAxisFrontPosition = 1.9;
    var wheelHalfTrackFront = 1.2;
    var wheelAxisHeightFront = 0.4;
    var wheelRadiusFront = .4;
    var wheelWidthFront = .3;

    var friction = 5;
    var suspensionStiffness = 10;
    var suspensionDamping = 0.3;
    var suspensionCompression = 4.4;
    var suspensionRestLength = 0.6;
    var rollInfluence = 0.0;

    var steeringIncrement = .01;
    var steeringClamp = 0.2;
    var maxEngineForce = 500;
    var maxBreakingForce = 10;
    var incEngine = 10.0;

    var FRONT_LEFT = 0;
    var FRONT_RIGHT = 1;
    var BACK_LEFT = 2;
    var BACK_RIGHT = 3;

    var wheelDirectionCS0;
    var wheelAxleCS;

    $(document).ready(function () {
        if (document.cookie.indexOf('visited=true') == -1) {
            $('#myModal').modal({
                show: true
            });

            // var year = 1000 * 60 * 60 * 24 * 365;
            var year = 10;
            var expires = new Date((new Date()).valueOf() + year);
            document.cookie = "visited=true;expires=" + expires.toUTCString();
        }
    });

    function createScene() {

        // Setup basic scene
        var scene = new BABYLON.Scene(engine);
        var camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 5, -10), scene);
        camera.setTarget(BABYLON.Vector3.Zero());
        camera.attachControl(canvas, true);
        var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        redMaterial = new BABYLON.StandardMaterial("RedMaterial", scene);
        redMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.4, 0.5);
        redMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.4, 0.5);

        blueMaterial = new BABYLON.StandardMaterial("RedMaterial", scene);
        blueMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.4, 0.8);
        blueMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.4, 0.8);

        greenMaterial = new BABYLON.StandardMaterial("RedMaterial", scene);
        greenMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.8, 0.5);
        greenMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.8, 0.5);

        blackMaterial = new BABYLON.StandardMaterial("RedMaterial", scene);
        blackMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        blackMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);

        myMaterial.diffuseTexture = new BABYLON.Texture("asfalt.jpg", scene);
        myMaterial.diffuseTexture.uScale = 10;
        myMaterial.diffuseTexture.vScale = 7;


        // Enable physics
        scene.enablePhysics(new BABYLON.Vector3(0, -10, 0), new BABYLON.AmmoJSPlugin());

        // wheelDirectionCS0 = new Ammo.btVector3(0, -1, 0);
        // wheelAxleCS = new Ammo.btVector3(-1, 0, 0);

        var ground = BABYLON.Mesh.CreateGround("ground", 100, 100, 2, scene);
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor
            .BoxImpostor, {
                mass: 0,
                friction: 0.5,
                restitution: 0.7
            }, scene);
        ground.material = myMaterial;

        loadMapModel("mapa1.glb", scene);
        loadCarModel("carModel2.glb", scene);

        scene.registerBeforeRender(function () {

            var carModel = scene.getMeshByName("Car_08");
            console.log(carModel);
            console.log("loaded car model");
            var curbFinish = scene.getMeshByName("collider_curb.013");


            var cars = ["collider_Car_04.000",
                "collider_Car_04.001",
                "collider_Car_04.002",
                "collider_Car_04.003"
            ];
            var carsMeshes = [];
            cars.forEach(element => {
                carsMeshes.push(scene.getMeshByName(element));
            });

            var dt = engine.getDeltaTime().toFixed() / 1000;

            if (vehicleReady) {

                var speed = vehicle.getCurrentSpeedKmHour();
                var maxSteerVal = 0.2;
                breakingForce = 0;
                engineForce = 0;

                if (carModel.intersectsMesh(curbFinish, false)) {
                    $('#finishModal').modal({
                        show: true
                    });
                }

                carsMeshes.forEach(element => {
                    if (carModel.intersectsMesh(element, true)) {
                        $('#failModal').modal({
                            show: true
                        });
                    }
                });

                if (actions.acceleration) {
                    if (speed < -1) {
                        breakingForce = maxBreakingForce;
                    } else {
                        engineForce = maxEngineForce;
                    }

                } else if (actions.braking) {
                    if (speed > 1) {
                        breakingForce = maxBreakingForce;
                    } else {
                        engineForce = -maxEngineForce;
                    }
                }

                if (actions.right) {
                    if (vehicleSteering < steeringClamp) {
                        vehicleSteering += steeringIncrement;
                    }

                } else if (actions.left) {
                    if (vehicleSteering > -steeringClamp) {
                        vehicleSteering -= steeringIncrement;
                    }

                } else {
                    vehicleSteering = 0;
                }

                vehicle.applyEngineForce(engineForce, FRONT_LEFT);
                vehicle.applyEngineForce(engineForce, FRONT_RIGHT);

                vehicle.setBrake(breakingForce / 2, FRONT_LEFT);
                vehicle.setBrake(breakingForce / 2, FRONT_RIGHT);
                vehicle.setBrake(breakingForce, BACK_LEFT);
                vehicle.setBrake(breakingForce, BACK_RIGHT);

                vehicle.setSteeringValue(vehicleSteering, FRONT_LEFT);
                vehicle.setSteeringValue(vehicleSteering, FRONT_RIGHT);


                var tm, p, q, i;
                var n = vehicle.getNumWheels();
                for (i = 0; i < n; i++) {
                    vehicle.updateWheelTransform(i, true);
                    tm = vehicle.getWheelTransformWS(i);
                    p = tm.getOrigin();
                    q = tm.getRotation();
                    wheelMeshes[i].position.set(p.x(), p.y(), p.z());
                    wheelMeshes[i].rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
                    wheelMeshes[i].rotate(BABYLON.Axis.Z, Math.PI / 2);
                }

                tm = vehicle.getChassisWorldTransform();
                p = tm.getOrigin();
                q = tm.getRotation();
                chassisMesh.position.set(p.x(), p.y(), p.z());
                chassisMesh.rotationQuaternion.set(q.x(), q.y(), q.z(), q.w());
                chassisMesh.rotate(BABYLON.Axis.X, Math.PI);
            }
        });

        setTimeout(function () {
            engine.stopRenderLoop();

            engine.runRenderLoop(function () {
                scene.render();  
            });
        }, 500);

        return scene;
    };

    function makePhysicsObject(newMeshes, scene, scaling) {
        // Create physics root and position it to be the center of mass for the imported mesh
        var physicsRoot = new BABYLON.Mesh("physicsRoot", scene);
        physicsRoot.position.y -= 0.9;

        // For all children labeled box (representing colliders), make them invisible and add them as a child of the root object
        newMeshes.meshes.forEach((m, i) => {
            if (m.name.indexOf("collider") != -1) {
                m.isVisible = true
                physicsRoot.addChild(m)
            }
        })

        // Add all root nodes within the loaded gltf to the physics root
        newMeshes.meshes.forEach((m, i) => {
            if (m.parent == null) {
                physicsRoot.addChild(m)
            }
        })

        // Make every collider into a physics impostor
        physicsRoot.getChildMeshes().forEach((m) => {
            if (m.name.indexOf("collider") != -1) {
                m.scaling.x = Math.abs(m.scaling.x)
                m.scaling.y = Math.abs(m.scaling.y)
                m.scaling.z = Math.abs(m.scaling.z)
                m.physicsImpostor = new BABYLON.PhysicsImpostor(m, BABYLON
                    .PhysicsImpostor
                    .BoxImpostor, {
                        mass: 0,
                        friction: 0.5,
                        restitution: 0.7
                    }, scene);
            }
        })

        // Scale the root object and turn it into a physics impsotor
        physicsRoot.scaling.scaleInPlace(scaling)
        physicsRoot.physicsImpostor = new BABYLON.PhysicsImpostor(physicsRoot, BABYLON
            .PhysicsImpostor
            .NoImpostor, {
                mass: 0,
                friction: 0.5,
                restitution: 0.7
            }, scene);

        return physicsRoot
    }


    function loadMapModel(mapName, scene) {

        // Import gltf
        BABYLON.SceneLoader.ImportMeshAsync("", "./", mapName, scene).then(function (
            newMeshes) {
            var physicsRoot = makePhysicsObject(newMeshes, scene, 1);
        });
    }

    function loadCarModel(carName, scene) {

        // Import gltf
        BABYLON.SceneLoader.ImportMeshAsync("", "./", carName, scene).then(function (
            newMeshes) {
            var physicsRoot = makePhysicsObject(newMeshes, scene, 1);
            createVehicle(new BABYLON.Vector3(0, 4, -20), ZERO_QUATERNION, physicsRoot, scene);
        });
    }


    function createVehicle(pos, quat, importedMesh, scene) {
        //Going Native
        var physicsWorld = scene.getPhysicsEngine().getPhysicsPlugin().world;

        var geometry = new Ammo.btBoxShape(new Ammo.btVector3(chassisWidth * .5, chassisHeight *
            .5, chassisLength *
            .5));
        var transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(0, 5, 0));
        transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        var motionState = new Ammo.btDefaultMotionState(transform);
        var localInertia = new Ammo.btVector3(0, 0, 0);
        geometry.calculateLocalInertia(massVehicle, localInertia);

        chassisMesh = createChassisMesh(importedMesh, scene);

        var massOffset = new Ammo.btVector3(0, 0.4, 0);
        var transform2 = new Ammo.btTransform();
        transform2.setIdentity();
        transform2.setOrigin(massOffset);
        var compound = new Ammo.btCompoundShape();
        compound.addChildShape(transform2, geometry);

        var body = new Ammo.btRigidBody(new Ammo.btRigidBodyConstructionInfo(massVehicle,
            motionState, compound,
            localInertia));
        body.setActivationState(4);

        physicsWorld.addRigidBody(body);

        var engineForce = 0;
        var vehicleSteering = 0;
        var breakingForce = 0;
        var tuning = new Ammo.btVehicleTuning();
        var rayCaster = new Ammo.btDefaultVehicleRaycaster(physicsWorld);
        vehicle = new Ammo.btRaycastVehicle(tuning, body, rayCaster);
        vehicle.setCoordinateSystem(0, 1, 2);
        physicsWorld.addAction(vehicle);

        var trans = vehicle.getChassisWorldTransform();


        function addWheel(isFront, pos, radius, width, index) {

            console.log("adding wheel");
            

            var wheelInfo = vehicle.addWheel(
                pos,
                wheelDirectionCS0,
                wheelAxleCS,
                suspensionRestLength,
                radius,
                tuning,
                isFront);

            wheelInfo.set_m_suspensionStiffness(suspensionStiffness);
            wheelInfo.set_m_wheelsDampingRelaxation(suspensionDamping);
            wheelInfo.set_m_wheelsDampingCompression(suspensionCompression);
            wheelInfo.set_m_maxSuspensionForce(600000);
            wheelInfo.set_m_frictionSlip(40);
            wheelInfo.set_m_rollInfluence(rollInfluence);

            wheelMeshes[index] = createWheelMesh(radius, width);
        }

        addWheel(true, new Ammo.btVector3(wheelHalfTrackFront, wheelAxisHeightFront,
                wheelAxisFrontPosition),
            wheelRadiusFront, wheelWidthFront, FRONT_LEFT);
        addWheel(true, new Ammo.btVector3(-wheelHalfTrackFront, wheelAxisHeightFront,
                wheelAxisFrontPosition),
            wheelRadiusFront, wheelWidthFront, FRONT_RIGHT);
        addWheel(false, new Ammo.btVector3(-wheelHalfTrackBack, wheelAxisHeightBack,
                wheelAxisPositionBack),
            wheelRadiusBack, wheelWidthBack, BACK_LEFT);
        addWheel(false, new Ammo.btVector3(wheelHalfTrackBack, wheelAxisHeightBack,
                wheelAxisPositionBack),
            wheelRadiusBack, wheelWidthBack, BACK_RIGHT);

        vehicleReady = true;
    }


    function createChassisMesh(mesh, scene) {

        // var mesh = new BABYLON.MeshBuilder.CreateBox("box", {
        //     width: w,
        //     depth: h,
        //     height: l
        // }, scene);
        mesh.rotationQuaternion = new BABYLON.Quaternion();
        mesh.material = greenMaterial;

        var camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10),
            scene);
        camera.radius = 10;
        camera.heightOffset = 4;
        camera.rotationOffset = 0;
        camera.cameraAcceleration = 0.05;
        camera.maxCameraSpeed = 400;
        camera.attachControl(canvas, true);
        camera.lockedTarget = mesh; //version 2.5 onwards
        scene.activeCamera = camera;

        return mesh;
    }


    function createWheelMesh(radius, width) {
        //var mesh = new BABYLON.MeshBuilder.CreateBox("wheel", {width:.82, height:.82, depth:.82}, scene);
        var mesh = new BABYLON.MeshBuilder.CreateCylinder("Wheel", {
            diameter: 1,
            height: 0.5,
        }, scene);
        mesh.rotationQuaternion = new BABYLON.Quaternion();
        mesh.material = blackMaterial;

        return mesh;
    }


    function keyup(e) {
        if (keysActions[e.code]) {
            actions[keysActions[e.code]] = false;
            //e.preventDefault();
            //e.stopPropagation();

            //return false;
        }
    }

    function keydown(e) {
        if (keysActions[e.code]) {
            actions[keysActions[e.code]] = true;
            //e.preventDefault();
            //e.stopPropagation();

            //return false;
        }
    }

    var scene2 = createScene();

    engine.runRenderLoop(function () {
        if (scene2) {
            scene2.render();
        }
    });

    // Resize
    window.addEventListener("resize", function () {
        engine.resize();
    });
}