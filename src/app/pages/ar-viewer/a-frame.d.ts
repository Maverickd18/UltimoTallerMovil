// src/app/pages/ar-viewer/a-frame.d.ts
// Type declarations for A-Frame elements

declare namespace JSX {
  interface IntrinsicElements {
    'a-scene': AFrameSceneAttributes;
    'a-entity': AFrameEntityAttributes;
    'a-marker': AFrameMarkerAttributes;
    'a-box': AFrameBoxAttributes;
    'a-sphere': AFrameSphereAttributes;
    'a-cylinder': AFrameCylinderAttributes;
    'a-camera': AFrameCameraAttributes;
  }

  interface AFrameSceneAttributes extends React.HTMLAttributes<HTMLElement> {
    embedded?: boolean;
    arjs?: string;
    'vr-mode-ui'?: string;
    renderer?: string;
  }

  interface AFrameEntityAttributes extends React.HTMLAttributes<HTMLElement> {
    id?: string;
    position?: string;
    scale?: string;
    rotation?: string;
    camera?: boolean;
    'look-controls'?: string;
    'wasd-controls'?: string;
  }

  interface AFrameMarkerAttributes extends React.HTMLAttributes<HTMLElement> {
    preset?: string;
    url?: string;
    smooth?: string;
    smoothCount?: string;
    smoothTolerance?: string;
    smoothThreshold?: string;
    emitevents?: string;
  }

  interface AFrameBoxAttributes extends React.HTMLAttributes<HTMLElement> {
    position?: string;
    scale?: string;
    rotation?: string;
    color?: string;
    material?: string;
  }

  interface AFrameSphereAttributes extends React.HTMLAttributes<HTMLElement> {
    position?: string;
    scale?: string;
    rotation?: string;
    color?: string;
    radius?: string;
  }

  interface AFrameCylinderAttributes extends React.HTMLAttributes<HTMLElement> {
    position?: string;
    scale?: string;
    rotation?: string;
    color?: string;
    height?: string;
    radius?: string;
  }

  interface AFrameCameraAttributes extends React.HTMLAttributes<HTMLElement> {
    position?: string;
    'look-controls'?: string;
    'wasd-controls'?: string;
  }
}
