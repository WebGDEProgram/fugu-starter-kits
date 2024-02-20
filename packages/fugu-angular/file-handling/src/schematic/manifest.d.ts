export interface Manifest {
  [key: string]: unknown;
  file_handlers?: FileHandler[];
}

// https://wicg.github.io/manifest-incubations/index.html#file_handlers-member
export interface FileHandler {
  action: string;
  accept: { [mediaType: string]: string[] };
}
