using AyaneShared;
using MagicOnion.Server;
using MagicOnion;

namespace AyaneServer.Services;

public class MyFirstService : ServiceBase<IMyFirstService>, IMyFirstService
{
    public async UnaryResult<int> SumAsync(int x, int y)
    {
        Console.WriteLine($"Received: {x}, {y}");
        await Task.CompletedTask;
        return x + y;
    }
}