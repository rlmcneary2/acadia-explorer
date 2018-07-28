declare module "worker-loader?name=httpWorker.js!./httpWorker" {
    class WebpackWorker extends Worker {
      constructor();
    }
   
    export default WebpackWorker;
}
