open Microsoft.AspNetCore.Builder
open Microsoft.AspNetCore.Http
open Microsoft.Extensions.DependencyInjection

[<EntryPoint>]
let main argv =
    let builder = WebApplication.CreateBuilder(argv)

    builder.Services.AddGrpc() |> ignore
    builder.Services.AddMagicOnion() |> ignore

    let app = builder.Build()

    app.UseRouting() |> ignore

    app.UseEndpoints(fun endpoints ->
        endpoints.MapMagicOnionService() |> ignore

        endpoints.MapGet(
            "/",
            fun context ->
                context.Response.WriteAsync(
                    "Communication with gRPC endpoints must be made through a gRPC client. To learn how to create a client, visit: https://go.microsoft.com/fwlink/?linkid=2086909"
                )
        )
        |> ignore

    )
    |> ignore

    app.Run()
    0
