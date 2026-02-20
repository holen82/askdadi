using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace DadiChatBot.Functions;

public class UserFunction
{
    private readonly ILogger<UserFunction> _logger;
    private readonly AuthService _authService;

    public UserFunction(ILogger<UserFunction> logger, AuthService authService)
    {
        _logger = logger;
        _authService = authService;
    }

    [Function("user")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "user")] HttpRequestData req)
    {
        _logger.LogInformation("User info request received");

        var user = _authService.ExtractUserFromHeaders(req);
        
        if (user == null)
        {
            _logger.LogWarning("No user found in request headers");
            var unauthorizedResponse = req.CreateResponse(System.Net.HttpStatusCode.Unauthorized);
            await unauthorizedResponse.WriteAsJsonAsync(new ErrorResponse
            {
                Error = "Unauthorized",
                Message = "User not authenticated"
            });
            return unauthorizedResponse;
        }

        var email = _authService.GetUserEmail(user);
        
        if (!_authService.IsWhitelisted(email))
        {
            _logger.LogWarning("User not whitelisted: {Email}", email);
            var forbiddenResponse = req.CreateResponse(System.Net.HttpStatusCode.Forbidden);
            await forbiddenResponse.WriteAsJsonAsync(new ErrorResponse
            {
                Error = "Forbidden",
                Message = "User not authorized to access this application"
            });
            return forbiddenResponse;
        }

        _logger.LogInformation("User authenticated successfully: {Email}", email);

        var name = _authService.GetUserName(user);

        var okResponse = req.CreateResponse(System.Net.HttpStatusCode.OK);
        await okResponse.WriteAsJsonAsync(new UserInfoResponse
        {
            Email = email ?? string.Empty,
            Name = name,
            Provider = user.IdentityProvider,
            UserId = user.UserId,
            IsAuthenticated = true
        });
        return okResponse;
    }
}
