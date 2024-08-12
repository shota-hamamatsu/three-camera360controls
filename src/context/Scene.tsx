import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const DEFAULT_CAMERA_POSITION: THREE.Vector3 = new THREE.Vector3(0, 10, 10);

export type SceneContextValue = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.Renderer;
  control: OrbitControls;
};

const SceneContext = createContext<SceneContextValue | null>(null);

export const useSceneContext = () => {
  const sceneCtx = useContext(SceneContext);
  if (!sceneCtx) throw new Error("SceneContext is null");
  return sceneCtx;
};

export const Scene = ({
  children,
}: {
  children?: ReactNode;
}): JSX.Element | null => {
  // canvasのRef
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // scene
  const { current: scene } = useRef<THREE.Scene>(new THREE.Scene());
  // camera
  const { current: camera } = useRef<THREE.PerspectiveCamera>(
    new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
  );
  // renderer
  const [renderer, setRenderer] = useState<THREE.Renderer>();
  // OrbitControls
  const [control, setControl] = useState<OrbitControls>();
  // ライト
  const [light] = useState(() => {
    const light = new THREE.AmbientLight(0xffaaff);
    light.position.set(10, 10, 10);
    return light;
  });

  /** リサイズハンドラ */
  const handleResize = useCallback(() => {
    if (!renderer || !camera) {
      return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }, [camera, renderer]);

  // 初期化
  useEffect(() => {
    if (!canvasRef.current) return;
    // レンダラー作成
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      depth: true,
    });
    // 背景色
    renderer.setClearColor(0xeeeeee);
    // レンダラーのアニメーション(FPSは環境依存)
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
    // cameraのpositionセット
    camera.position.set(
      DEFAULT_CAMERA_POSITION.x,
      DEFAULT_CAMERA_POSITION.y,
      DEFAULT_CAMERA_POSITION.z
    );
    // 画面のコントロール作成
    const control = new OrbitControls(camera, renderer.domElement);
    // ライト追加
    scene.add(light);
    setRenderer(renderer);
    setControl(control);
  }, [camera, canvasRef, light, scene]);

  // リサイズイベント
  useEffect(handleResize, [handleResize]);

  /** コンテキスト */
  const sceneContext = useMemo<SceneContextValue | null>(() => {
    if (!renderer || !control) return null;
    return {
      scene,
      renderer,
      control,
      camera,
    };
  }, [camera, control, renderer, scene]);

  return (
    <>
      <canvas ref={canvasRef} />
      {sceneContext ? (
        <SceneContext.Provider value={sceneContext}>
          {children}
        </SceneContext.Provider>
      ) : null}
    </>
  );
};
