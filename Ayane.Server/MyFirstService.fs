namespace Ayane.Server.Services

open Ayane.Shared
open System.Threading.Tasks
open MagicOnion.Server
open MagicOnion

type MyFirstService() =
    inherit ServiceBase<IMyFirstService>()

    interface IMyFirstService with
        member this.SumAsync x y =
            printfn $"Received: {x}, {y}"
            Task.CompletedTask |> Async.AwaitTask |> ignore
            UnaryResult(x + y)
