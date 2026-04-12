using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using TimePunchSite.Server.Data;
using TimePunchSite.Server.Security;

var builder = WebApplication.CreateBuilder(args);

// Add service defaults & Aspire client integrations.
builder.AddServiceDefaults();
builder.AddRedisClientBuilder("cache")
    .WithOutputCache();

// Add services to the container.
builder.Services.AddProblemDetails();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Configure JWT authentication
var jwtKey = builder.Configuration["Jwt:Key"];
var key = Encoding.UTF8.GetBytes(jwtKey!);

// Set up authentication with JWT Bearer tokens
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

// Add authorization services
builder.Services.AddAuthorization();

// Add the DatabaseService to the dependency injection container
// scoped lifetime is appropriate for database services to ensure a new instance per request
builder.Services.AddScoped<DatabaseService>();
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<EmployeeRepository>();

// Add the JwtService to the dependency injection container
builder.Services.AddScoped<JwtService>();

//var connectionString = builder.Configuration.GetConnectionString("TimePunchDB");

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseOutputCache();

// Enable authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api");

api.MapPost("check-login", (
    LoginRequest data,
    EmployeeRepository repo,
    JwtService jwtService) =>
{
    // Validate inputs
    if (data.Id <= 0 || string.IsNullOrEmpty(data.Password))
        return Results.BadRequest("Invalid input data.");

    // Check login credentials against the database
    //bool isValid = DataLayer.CheckLogin(connectionString, data.Id, data.Password);
    bool isValid = repo.CheckLogin(data.Id, data.Password);

    if (!isValid)
        return Results.Json(new { success = false, message = "Invalid ID or Password" }, statusCode: 401);

    var token = jwtService.GenerateToken(data.Id);

    return Results.Ok(new
    {
        success = true,
        token
    });
})
.WithName("CheckLogin");

// Example of a secure endpoint that requires authentication
api.MapPost("get-timepunches", [Authorize] (EmployeeRepository repo, ClaimsPrincipal user) =>
{
    int userId = getUserIdFromClaims(user);
    var punches = repo.GetTimePunches(userId);

    return Results.Ok(punches);
})
.WithName("GetTimePunches");

api.MapPost("get-timepunches-data", [Authorize] (EmployeeRepository repo, ClaimsPrincipal user) =>
{
    int userId = getUserIdFromClaims(user);
    var punches = repo.GetTimePunchDataList(userId);

    return Results.Ok(punches);
})
.WithName("GetTimePunchesData");

api.MapPost("get-user-id", [Authorize] (ClaimsPrincipal user) =>
{
    return Results.Ok(new { id = getUserIdFromClaims(user) });
}).WithName("GetId");

app.MapDefaultEndpoints();

app.UseFileServer();

app.Run();

static int getUserIdFromClaims(ClaimsPrincipal user)
{
    var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);

    return userIdClaim == null ? throw new InvalidOperationException("User ID claim is missing.") : int.Parse(userIdClaim.Value);
}
