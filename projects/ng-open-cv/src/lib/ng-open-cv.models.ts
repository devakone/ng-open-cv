export interface OpenCVLocateFileFn {
  (path: string, scriptDirectory: string);
}

export interface OpenCvRuntimeInitializedFn {
  ();
}

export interface OpenCVOptions {
  scriptUrl: string;
  wasmBinaryFile?: string;
  usingWasm?: boolean;
  locateFile?: OpenCVLocateFileFn;
  onRuntimeInitialized?: OpenCvRuntimeInitializedFn;
}

export interface OpenCVLoadResult {
  ready: boolean;
  error: boolean;
  loading: boolean;
}
