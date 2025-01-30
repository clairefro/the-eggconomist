![The Eggconomist](./banner.png)

## The Eggconomist

Eggspert analysis on the US economy.

[Average Price: Eggs, Grade A, Large (Cost per Dozen) in U.S. City Average  (APU0000708111)](https://fred.stlouisfed.org/series/APU0000708111)

Series IDs

- Avg Price: APU0000708111
- CPI: CUUR0000SEFH

Data source: [U.S. Bureau of Labor Statistics](https://www.bls.gov/)

### Development

setting env vars locally for testing

**activate env**

```py
python3 -m venv myenv # if needed
source myenv/bin/activate
```

**for update_egg_prices.py**

```sh
echo 'export BLS_API_KEY="api_key_here"' >> myenv/bin/activate
deactivate
source myenv/bin/activate
```

**for webpage**

`pip3 install livereload`

`python3 dev_server.py`
