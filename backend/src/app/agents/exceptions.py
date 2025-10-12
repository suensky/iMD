class AgentError(RuntimeError):
    """Base error raised for agent execution failures."""


class AgentConfigurationError(AgentError):
    """Raised when an agent is misconfigured or missing credentials."""


class AgentNotFoundError(AgentError):
    """Raised when a request references an unknown agent identifier."""


class AgentExecutionError(AgentError):
    """Raised when an agent fails while processing a request."""
