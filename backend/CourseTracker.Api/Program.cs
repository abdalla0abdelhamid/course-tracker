using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors();
var app = builder.Build();
app.UseCors(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());

var dataFile = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "data.json");
var jsonOpts = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
var gate = new SemaphoreSlim(1, 1);

AppData Load()
{
    if (!File.Exists(dataFile)) return new();
    var text = File.ReadAllText(dataFile);
    if (string.IsNullOrWhiteSpace(text)) return new();
    return JsonSerializer.Deserialize<AppData>(text, jsonOpts) ?? new();
}

async Task Save(AppData data)
{
    await gate.WaitAsync();
    try { await File.WriteAllTextAsync(dataFile, JsonSerializer.Serialize(data, jsonOpts)); }
    finally { gate.Release(); }
}

app.MapGet("/api/data", () => Results.Ok(Load()));

// ---- Modules ----
app.MapPost("/api/modules", async (TextInput input) =>
{
    var d = Load();
    var m = new Module { Id = Guid.NewGuid().ToString("N"), Name = input.Text, Topics = new() };
    d.Modules.Add(m);
    await Save(d);
    return Results.Ok(m);
});

app.MapDelete("/api/modules/{id}", async (string id) =>
{
    var d = Load();
    d.Modules.RemoveAll(m => m.Id == id);
    await Save(d);
    return Results.Ok();
});

app.MapPost("/api/modules/{id}/topics", async (string id, TextInput input) =>
{
    var d = Load();
    var m = d.Modules.FirstOrDefault(x => x.Id == id);
    if (m is null) return Results.NotFound();
    var t = new Topic { Id = Guid.NewGuid().ToString("N"), Name = input.Text, Done = false };
    m.Topics.Add(t);
    await Save(d);
    return Results.Ok(t);
});

app.MapPatch("/api/modules/{id}/topics/{topicId}", async (string id, string topicId, DoneInput input) =>
{
    var d = Load();
    var t = d.Modules.FirstOrDefault(x => x.Id == id)?.Topics.FirstOrDefault(x => x.Id == topicId);
    if (t is null) return Results.NotFound();
    t.Done = input.Done;
    await Save(d);
    return Results.Ok(t);
});

app.MapDelete("/api/modules/{id}/topics/{topicId}", async (string id, string topicId) =>
{
    var d = Load();
    d.Modules.FirstOrDefault(x => x.Id == id)?.Topics.RemoveAll(t => t.Id == topicId);
    await Save(d);
    return Results.Ok();
});

// ---- Priorities (task list) ----
app.MapPost("/api/priorities", async (TextInput input) =>
{
    var d = Load();
    var p = new PriorityItem { Id = Guid.NewGuid().ToString("N"), Text = input.Text, Done = false };
    d.Priorities.Add(p);
    await Save(d);
    return Results.Ok(p);
});

app.MapPatch("/api/priorities/{id}", async (string id, DoneInput input) =>
{
    var d = Load();
    var p = d.Priorities.FirstOrDefault(x => x.Id == id);
    if (p is null) return Results.NotFound();
    p.Done = input.Done;
    await Save(d);
    return Results.Ok(p);
});

app.MapDelete("/api/priorities/{id}", async (string id) =>
{
    var d = Load();
    d.Priorities.RemoveAll(p => p.Id == id);
    await Save(d);
    return Results.Ok();
});

// ---- Ideas (quick capture) ----
app.MapPost("/api/ideas", async (TextInput input) =>
{
    var d = Load();
    var i = new IdeaItem { Id = Guid.NewGuid().ToString("N"), Text = input.Text };
    d.Ideas.Add(i);
    await Save(d);
    return Results.Ok(i);
});

app.MapDelete("/api/ideas/{id}", async (string id) =>
{
    var d = Load();
    d.Ideas.RemoveAll(i => i.Id == id);
    await Save(d);
    return Results.Ok();
});

app.Run();

class AppData { public List<Module> Modules { get; set; } = new(); public List<PriorityItem> Priorities { get; set; } = new(); public List<IdeaItem> Ideas { get; set; } = new(); }
class Module { public string Id { get; set; } = ""; public string Name { get; set; } = ""; public List<Topic> Topics { get; set; } = new(); }
class Topic { public string Id { get; set; } = ""; public string Name { get; set; } = ""; public bool Done { get; set; } }
class PriorityItem { public string Id { get; set; } = ""; public string Text { get; set; } = ""; public bool Done { get; set; } }
class IdeaItem { public string Id { get; set; } = ""; public string Text { get; set; } = ""; }
record TextInput(string Text);
record DoneInput(bool Done);
