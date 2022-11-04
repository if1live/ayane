open Grpc.Net.Client
open MagicOnion.Client
open Ayane.Shared

let run (client: IMyFirstService) =
    async {
        let result = client.SumAsync 123 456
        let! value = result.ResponseAsync |> Async.AwaitTask
        printfn $"result: {value}"
    }

[<EntryPoint>]
let main argv =
    let channel = GrpcChannel.ForAddress("https://localhost:7253")
    let client = MagicOnionClient.Create<IMyFirstService>(channel)

    run client
    |> Async.RunSynchronously
    
    0

