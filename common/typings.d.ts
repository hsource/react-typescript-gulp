// Put additional libdefs in here
declare module 'wordwrap' {
  type WordWrapFunc = (str: string) => string;
  export default function WordWrap(start: number, end: number): WordWrapFunc;
}
