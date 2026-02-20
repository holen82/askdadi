using DadiChatBot.Models;
using DadiChatBot.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
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
    public IActionResult Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "user")] HttpRequest req)
    {
        _logger.LogInformation("User info request received");

        var user = _authService.ExtractUserFromHeaders(req);
        
        if (user == null)
        {
            _logger.LogWarning("No user found in request headers");
            return new UnauthorizedObjectResult(new ErrorResponse
            {
                Error = "Unauthorized",
                Message = "User not authenticated"
            });
        }

        var email = _authService.GetUserEmail(user);
        
        if (!_authService.IsWhitelisted(email))
        {
            _logger.LogWarning("User not whitelisted: {Email}", email);
            return new ObjectResult(new ErrorResponse
            {
                Error = "Forbidden",
                Message = "User not authorized to access this application"
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }

        _logger.LogInformation("User authenticated successfully: {Email}", email);

        return new OkObjectResult(new UserInfoResponse
        {
            Email = email ?? string.Empty,
            Provider = user.IdentityProvider,
            UserId = user.UserId,
            IsAuthenticated = true
        });
    }
}
