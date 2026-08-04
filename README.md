# @pipeworx/openfigi

[OpenFIGI](https://www.openfigi.com) MCP — Bloomberg's open financial-instrument identifier symbology service. Map ticker / CUSIP / ISIN / SEDOL → FIGI and back. Keyless free tier (rate-limited).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `map(jobs)` — map up to 100 instrument-id queries → FIGIs (POST). Each job: {idType, idValue, [exchCode], [securityType], [marketSecDes]}.
- `search(query, exchCode?, currency?, securityType?, marketSecDes?)` — text search for instruments
- `filter(idType, value, exchCode?, currency?)` — filter search (subset of search supported by OpenFIGI)

## Data source

`https://api.openfigi.com/v3/`

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "openfigi": {
      "url": "https://gateway.pipeworx.io/openfigi/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Openfigi data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
