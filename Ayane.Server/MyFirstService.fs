namespace Ayane.Server.Services

open MagicOnion.Server
open MagicOnion
open Ayane.Shared

type MyFirstService() =
    inherit ServiceBase<IMyFirstService>()

    interface IMyFirstService with
        member this.SumAsync x y =
            let workflow = async {
                printfn $"Received: {x}, {y}"
                do! Async.Sleep 1000
                printfn $"sleep complete: {x}, {y}"
                return UnaryResult(x + y)
            }
            Async.RunSynchronously workflow
