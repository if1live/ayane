using Grpc.Core;
using AyaneServer;
using AyaneShared;
using MagicOnion.Server;
using MagicOnion;

namespace AyaneServer.Services;

public class GreeterService : Greeter.GreeterBase
{
    private readonly ILogger<GreeterService> _logger;
    public GreeterService(ILogger<GreeterService> logger)
    {
        _logger = logger;
    }

    public override Task<HelloReply> SayHello(HelloRequest request, ServerCallContext context)
    {
        return Task.FromResult(new HelloReply
        {
            Message = "Hello " + request.Name
        });
    }
}

public class MyFirstService : ServiceBase<IMyFirstService>, IMyFirstService
{
    public async UnaryResult<int> SumAsync(int x, int y)
    {
        Console.WriteLine($"Received: {x}, {y}");
        await Task.CompletedTask;
        return x + y;
    }
}