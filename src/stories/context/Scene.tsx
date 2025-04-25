import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import * as THREE from "three";
import { Camera360Controls } from "../../Camera360Controls";

const DEFAULT_CAMERA_POSITION: THREE.Vector3 = new THREE.Vector3(0, 10, 10);
const DEFAULT_CAMERA_ROTATION: THREE.Euler = new THREE.Euler(
  -0.8700678484298644,
  -0.010699096699409466,
  -0.012682729228320708,
);

export type SceneContextValue = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer | null;
  controls: Camera360Controls;
};

const SceneContext = createContext<SceneContextValue | null>(null);

export const useSceneContext = () => {
  const sceneCtx = useContext(SceneContext);
  if (!sceneCtx) throw new Error("SceneContext is null");
  return sceneCtx;
};

export const Scene = ({
  initialCameraPosition = DEFAULT_CAMERA_POSITION,
  initialCameraRotation = DEFAULT_CAMERA_ROTATION,
  children,
}: {
  initialCameraPosition?: THREE.Vector3Like;
  initialCameraRotation?: THREE.Euler;
  children?: ReactNode;
}): JSX.Element | null => {
  // canvasのRef
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // renderer
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  // scene
  const { current: scene } = useRef<THREE.Scene>(new THREE.Scene());
  // camera
  const { current: camera } = useRef<THREE.PerspectiveCamera>(
    new THREE.PerspectiveCamera()
  );
  // Camera360Controls
  const { current: controls } = useRef<Camera360Controls>(new Camera360Controls(camera));

  // ライト
  const [light] = useState(() => {
    const light = new THREE.AmbientLight(0xffaaff);
    light.position.set(10, 10, 10);
    return light;
  });
  const [axisHelper] = useState(() => {
    const axisHelper = new THREE.AxesHelper(5);
    axisHelper.position.set(0, 0, 0);
    return axisHelper;
  });
  const [gridHelper] = useState(() => {
    const gridHelper = new THREE.GridHelper(100, 100);
    gridHelper.position.set(0, 0, 0);
    return gridHelper;
  });

  // 初期化
  useEffect(() => {
    if (!canvasRef.current) return;
    // レンダラー作成
    rendererRef.current = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      depth: true,
    });
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    // 背景色
    rendererRef.current.setClearColor(0xeeeeee);
    // レンダラーのアニメーション(FPSは環境依存)
    rendererRef.current.setAnimationLoop(() => {
      rendererRef.current?.render(scene, camera);
    });
    // cameraのpositionセット
    camera.position.copy(initialCameraPosition);
    camera.rotation.copy(initialCameraRotation);
    controls.connect(canvasRef.current);
    // ライト追加
    scene.add(light);
    scene.add(axisHelper);
    scene.add(gridHelper);
    return () => {
      // レンダラーのアニメーション停止
      rendererRef.current?.setAnimationLoop(null);
      // canvasのクリーンアップ
      rendererRef.current?.dispose();
      // sceneのクリーンアップ
      scene.clear();
      // cameraのクリーンアップ
      controls.disconnect();
    }
  }, [camera, canvasRef, light, scene]);

  useEffect(() => {
    const handleChange = () => {
      console.log("camera position/rotation", camera.position.clone(), camera.rotation.clone());
    }
    controls.addEventListener("change", handleChange);
    return () => {
      controls.removeEventListener("change", handleChange);
    };
  }, [controls, camera]);

  /** コンテキスト */
  const sceneContext = useMemo<SceneContextValue>(() => {
    return {
      scene,
      renderer: rendererRef.current,
      controls,
      camera,
    };
  }, [camera, controls, scene]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
      {sceneContext ? (
        <SceneContext.Provider value={sceneContext}>
          {children}
        </SceneContext.Provider>
      ) : null}
    </>
  );
};
