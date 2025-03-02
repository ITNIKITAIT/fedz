import { useState, useEffect } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useChainId,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { useEthersSigner } from "../hooks/useEthersSigner";
import ScaleLoader from "react-spinners/ScaleLoader";
import {
  mainnet,
  arbitrum,
  bscTestnet,
  base,
  bsc,
  sepolia,
} from "@reown/appkit/networks";
import {
  PoolSwapTestAddress,
  HookAddress,
  MockFUSDAddress,
  MockUSDTAddress,
  TimeSlotSystemAddress,
} from "../contractAddress";
import PoolSwapTestAbi from "../abi/PoolSwapTest_abi.json";
import MockERC20Abi from "../abi/MockERC20_abi.json";
import { getPoolId } from "../misc/v4helpers";
import MockERC721Abi from "../abi/MockERC721_abi.json";
import { MockERC721Address } from "../contractAddress";
import TimeSlotSystemAbi from "../abi/TimeSlotSystem_abi.json";
import PoolKeyHashDisplay from "./PoolKeyHash";
import RoundInfos from "./RoundInfos";
import Title from "./ui/Title";
import Container from "./Container";
import ActionWindows from "./ActionWindows";
import { ChainId, USDT_ADDR, FUSD_ADDR, chainId } from "../config";
import TokenInput from "./swap/TokenInput";
import BalanceDisplay from "./swap/BalanceDisplay";
import { TokenInfo } from "../type";
import V4UseSwap from "../hooks/V4UseSwap";
import { Token } from "@uniswap/sdk-core";


let autofillTimeout: NodeJS.Timeout | undefined;
const V4SwapComponent = () => {
  const activeChainId = useChainId();

  const [poolKeyHash, setPoolKeyHash] = useState("");
  const [amount, setAmount] = useState("1");
  const [token0, setToken0] = useState(MockFUSDAddress);
  const [token1, setToken1] = useState(MockUSDTAddress);
  const [v4Token0, setV4Token0] = useState<Token>(new Token(activeChainId, token0, 18, "FUSD", "FUSD"));
  const [v4Token1, setV4Token1] = useState<Token>(new Token(activeChainId, token1, 6, "USDT", "USDT"));
  // const [tokenA, setTokenA] = useState<Token>(v4Token0);
  // const [tokenB, setTokenB] = useState<Token>(v4Token1);
  const [tokenIn, setTokenIn] = useState<Token>(v4Token0);
  const [tokenOut, setTokenOut] = useState<Token>(v4Token1);
  
  const [tickSpacing, setTickSpacing] = useState(60);
  const [swapFee, setSwapFee] = useState(4000);
  const [isToken0Approved, setIsToken0Approved] = useState(false);
  const [isToken1Approved, setIsToken1Approved] = useState(false);
  const [MockFUSDBalanceState, setMockFUSDBalanceState] = useState<BigInt>(
    BigInt(0)
  );
  const [MockUSDTBalanceState, setMockUSDTBalanceState] = useState<BigInt>(
    BigInt(0)
  );

  const [isNFTHolderState, setIsNFTHolderState] = useState(false);
  const [isPlayerTurnState, setIsPlayerTurnState] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const signer = useEthersSigner();
  const { address } = useAccount();
  // const [tokenA, setTokenA] = useState<TokenInfo>(USDT_ADDR[ChainId]);
  // const [tokenB, setTokenB] = useState<TokenInfo>(FUSD_ADDR[ChainId]);
  const { loading, swapExactTokensForTokens, quote, getQuote, quoteLoading, updateAmountIn, updateAmountOut } =
  V4UseSwap(activeChainId,amount, signer, tokenIn, tokenOut);

  const { data: tokenABalance ,refetch:refetchTokenABalance} = useBalance({
    address,
    chainId: ChainId,
    token: token0 as "0x",
  });

  const { data: tokenBBalance, refetch:refetchTokenBBalance} = useBalance({
    address,
    chainId: ChainId,
    token: token1 as "0x",
  });

  // Function to swap tokens
  const switchTokens = () => {
    setTimeout(() => {
      setToken0(token1);
      setToken1(token0);
    }, 500); // Adjust this delay to match your rotation animation duration
  };

  const [hookData, setHookData] = useState<`0x${string}`>("0x0"); // New state for custom hook data
  const [swapError, setSwapError] = useState();

  const MIN_SQRT_PRICE_LIMIT = BigInt("4295128739") + BigInt("1");
  const MAX_SQRT_PRICE_LIMIT =
    BigInt("1461446703485210103287273052203988822378723970342") - BigInt("1");

  const {
    data: writeSwapData,
    error: writeSwapError,
    isPending: isSwapPending,
    writeContract: writeSwapContract,
  } = useWriteContract();
  const {
    data: writeApprove0Data,
    error: writeApprove0Error,
    isPending: isApprove0Pending,
    writeContract: writeApproveToken0Contract,
  } = useWriteContract();
  const {
    data: writeApprove1Data,
    error: writeApprove1Error,
    isPending: isApprove1Pending,
    writeContract: writeApproveToken1Contract,
  } = useWriteContract();

  const { data: isNFTHolder } = useReadContract({
    address: MockERC721Address,
    abi: MockERC721Abi,
    functionName: "isNFTHolder",
    args: [address],
  });

  const { data: isPlayerTurn } = useReadContract({
    address: TimeSlotSystemAddress,
    abi: TimeSlotSystemAbi,
    functionName: "canPlayerAct",
    args: [address],
  });

  useEffect(() => {
    if (isPlayerTurn !== undefined) {
      setIsPlayerTurnState(isPlayerTurn as boolean);
    }
  }, [isPlayerTurn]);

  useEffect(() => {
    if (isNFTHolder !== undefined) {
      setIsNFTHolderState(isNFTHolder as boolean);
    }
    console.log("is address NFT holder", isNFTHolder);
  }, [isNFTHolder]);

  const { data: token0Allowance } = useReadContract({
    address: MockFUSDAddress,
    abi: MockERC20Abi,
    functionName: "allowance",
    args: [address, PoolSwapTestAddress],
  });

  const { data: token1Allowance } = useReadContract({
    address: MockUSDTAddress,
    abi: MockERC20Abi,
    functionName: "allowance",
    args: [address, PoolSwapTestAddress],
  });

  const { data: MockFUSDBalance } = useReadContract({
    address: MockFUSDAddress,
    abi: MockERC20Abi,
    functionName: "balanceOf",
    args: [address],
  });

  const { data: MockUSDTBalance } = useReadContract({
    address: MockUSDTAddress,
    abi: MockERC20Abi,
    functionName: "balanceOf",
    args: [address],
  });

  useEffect(() => {
    if (token0Allowance != null && token1Allowance != null && amount != null) {
      try {
        const amountBigInt = parseEther(amount.toString());
        const token0AllowanceBigInt = BigInt(token0Allowance.toString());
        const token1AllowanceBigInt = BigInt(token1Allowance.toString());
        const isToken0Approved = token0AllowanceBigInt >= amountBigInt;
        const isToken1Approved = token1AllowanceBigInt >= amountBigInt;
        setIsToken0Approved(isToken0Approved);
        setIsToken1Approved(isToken1Approved);
      } catch (error) {
        console.error("Error converting values to BigInt:", error);
        setIsToken0Approved(false);
        setIsToken1Approved(false);
      }
    } else {
      setIsToken0Approved(false);
      setIsToken1Approved(false);
    }
  }, [token0Allowance, token1Allowance, amount]);

  useEffect(() => {
    if (MockFUSDBalance != null && MockUSDTBalance != null) {
      try {
        const formattedToken0Balance = MockFUSDBalance;
        const formattedToken1Balance = MockUSDTBalance;

        setMockFUSDBalanceState(formattedToken0Balance as BigInt);
        setMockUSDTBalanceState(formattedToken1Balance as BigInt);
      } catch (error) {
        console.error("Error formatting balance values:", error);
        setMockFUSDBalanceState(BigInt(0));
        setMockUSDTBalanceState(BigInt(0));
      }
    } else {
      setMockFUSDBalanceState(BigInt(0));
      setMockUSDTBalanceState(BigInt(0));
    }
  }, [MockFUSDBalance, MockUSDTBalance]);

  const approveFUSD = async () => {
    try {
      await writeApproveToken0Contract({
        address: MockFUSDAddress,
        abi: MockERC20Abi,
        functionName: "approve",
        args: [PoolSwapTestAddress, parseEther(amount)],
      });
    } catch (err) {
      console.log(err);
    }
  };

  const approveUSDT = async () => {
    try {
      await writeApproveToken1Contract({
        address: MockUSDTAddress,
        abi: MockERC20Abi,
        functionName: "approve",
        args: [PoolSwapTestAddress, parseEther(amount)],
      });
    } catch (err) {
      console.log(err);
    }
  };

  const tokenOptions = [
    { value: USDT_ADDR[ChainId], label: "USDT", decimals: 6 },
    { value: FUSD_ADDR[ChainId], label: "FUSD", decimals: 18 },
  ];

  const handleTokenSelection = (selectedToken: Token, isInput: boolean) => {
    if (isInput) {
      if (selectedToken.address === tokenOut.address) {
        setTokenIn(tokenOut);
        setTokenOut(tokenIn);
      } else {
        setTokenIn(selectedToken);
      }
    } else {
      if (selectedToken.address === tokenIn.address) {
        setTokenIn(tokenIn);
        setTokenOut(tokenOut);
      } else {
        setTokenOut(selectedToken);
      }
    }
  };

  const handleToggleTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };

  const arbSwap = async () => {
    await swapExactTokensForTokens(amount);
    refetchTokenABalance();
    refetchTokenBBalance();

  };

  const swap = async () => {
    try {
      const result = await writeSwapContract({
        address: PoolSwapTestAddress,
        abi: PoolSwapTestAbi,
        functionName: "swap",
        args: [
          {
            currency0:
              token0.toLowerCase() < token1.toLowerCase() ? token0 : token1,
            currency1:
              token0.toLowerCase() < token1.toLowerCase() ? token1 : token0,
            fee: Number(swapFee),
            tickSpacing: Number(tickSpacing),
            hooks: HookAddress,
          },
          {
            zeroForOne: token0.toLowerCase() < token1.toLowerCase(),
            amountSpecified: parseEther(amount), // TODO: assumes tokens are always 18 decimals
            sqrtPriceLimitX96:
              token0.toLowerCase() < token1.toLowerCase()
                ? MIN_SQRT_PRICE_LIMIT
                : MAX_SQRT_PRICE_LIMIT, // unlimited impact
          },
          {
            takeClaims: false,
            settleUsingBurn: false,
          },
          hookData,
        ],
      });
      console.log("Swap transaction sent:", writeSwapData);
    } catch (error) {
      console.error("Error in deposit:", error);
      //setSwapError(error);
    }
  };

  useEffect(() => {
    if (
      token0 &&
      token1 &&
      swapFee !== undefined &&
      tickSpacing !== undefined &&
      HookAddress
    ) {
      try {
        const id = getPoolId({
          currency0: token0,
          currency1: token1,
          fee: swapFee,
          tickSpacing,
          hooks: HookAddress,
        });
        setPoolKeyHash(id);
      } catch (error) {
        console.error("Error calculating pool ID:", error);
        setPoolKeyHash("");
      }
    } else {
      setPoolKeyHash("");
    }
  }, [token0, token1, swapFee, tickSpacing, HookAddress]);

  const handleMaxClick = () => {
    if (token0.toLowerCase() === MockFUSDAddress.toLowerCase())
      setAmount(formatEther(MockFUSDBalanceState as bigint));
    if (token0.toLowerCase() === MockUSDTAddress.toLowerCase())
      setAmount(formatEther(MockUSDTBalanceState as bigint));
  };

  useEffect(() => {
    if (amount) {
      if (autofillTimeout) {
        clearTimeout(autofillTimeout);
      }
      autofillTimeout = setTimeout(() => {
        updateAmountIn(amount);
      }, 700);
    }
  }, [amount]);

  return (
    <div>
      <section className="pb-[50px] md:pb-[75px] relative">
        <Title className="text-center">Swap Tokens</Title>
        <Container>
          <div className="max-w-[620px] p-3 sm:p-6 mx-auto bg-white/10 rounded-[24px] mt-8">
            <div className="">
              {/* Token A Input */}
              <div className="p-5 rounded-2xl border-white/20 border-[1px] text-primary">
                <BalanceDisplay label="Input Token" balance={tokenABalance} />
                <TokenInput
                  amount={amount}
                  setAmount={setAmount}
                  token={tokenIn}
                  setToken={(token: any) => handleTokenSelection(token, true)}
                  options={[{
                    value: tokenIn,
                    label: tokenIn.symbol || '-',
                  }]}
                />
              </div>

              {/* Toggle Button */}
              <div className="flex justify-center my-4">
                <button
                  onClick={handleToggleTokens}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-full transition"
                >
                  <svg
                    className="transition-all duration-300 hover:scale-[113%]"
                    width="40"
                    height="27"
                    viewBox="0 0 40 27"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M25.2391 21.7921L22.0021 18.4571C21.0618 17.4883 21.0618 15.9476 22.0021 14.9788C22.9261 14.0268 24.4541 14.0268 25.3781 14.9788L25.676 15.2857L27.662 17.3318L27.662 8.98387L27.662 3.13885C27.662 1.76786 28.7734 0.656443 30.1444 0.656443C31.5154 0.656443 32.6268 1.76786 32.6268 3.13886L32.6268 8.98387L32.6268 17.3318L34.6127 15.2857L34.9106 14.9788C35.8346 14.0268 37.3627 14.0268 38.2867 14.9788C39.227 15.9476 39.227 17.4883 38.2867 18.4571L35.0695 21.7717L33.0147 23.8887C31.4435 25.5075 28.8453 25.5075 27.2741 23.8887L25.2391 21.7921Z"
                      fill="#4A88ED"
                    />
                    <path
                      d="M14.952 11.5602L12.9661 9.51414L12.9661 17.862L12.9661 23.707C12.9661 25.078 11.8547 26.1894 10.4837 26.1894C9.11267 26.1894 8.00126 25.078 8.00126 23.707L8.00126 17.862L8.00126 9.51414L6.01533 11.5602L5.71744 11.8671C4.79342 12.8191 3.26538 12.8191 2.34136 11.8671C1.40105 10.8983 1.40105 9.35759 2.34136 8.38881L5.55857 5.07421L7.61339 2.95718C9.18457 1.33843 11.7828 1.33843 13.354 2.95718L15.3889 5.05375L18.626 8.38881C19.5663 9.35759 19.5663 10.8983 18.626 11.8671C17.702 12.8191 16.1739 12.8191 15.2499 11.8671L14.952 11.5602Z"
                      fill="#4A88ED"
                    />
                  </svg>
                </button>
              </div>

              {/* Token B Output */}
              <div className="p-5 rounded-2xl border-white/20 border-[1px] text-primary">
                <BalanceDisplay
                  label="Output Token"
                  balance={tokenBBalance}
                />
                <TokenInput
                  amount={
                    quoteLoading
                      ? "---" // Show a placeholder text during quote calculation
                      : Number(quote).toFixed(6) || "0"
                  }
                  setAmount={() => {}} // Disable changing amount for output token
                  token={tokenOut}
                  setToken={(token: any) => handleTokenSelection(token, false)}
                  options={[{
                    value: tokenOut,
                    label: tokenOut.symbol || '-',
                  }]}
                />
              </div>
              <div className="pt-6">
                <button
                disabled={loading}
                  onClick={arbSwap}
                  className="btn btn-primary w-full hover:scale-105 transition-transform duration-200"
                >
                  {loading ? (
                    <ScaleLoader
                      height={20}
                      loading={loading}
                      color="#ffffff"
                      className="text-white"
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                  ) : (
                    "Swap"
                  )}
                </button>
              </div>
            </div>
          </div>
        </Container>

        <img
          src="/cursor/11.png"
          alt="money"
          className="absolute w-full top-0 lg:top-[200px] left-[10px] lg:left-[60px] max-w-[60px] lg:max-w-[170px] pointer-events-none"
        />

        <img
          src="/cursor/1.png"
          alt="coin"
          className="absolute w-full top-[95%] lg:top-[500px] right-[20px] max-w-[40px] lg:max-w-[60px] pointer-events-none"
        />
      </section>

      <ActionWindows />

      <section className="relative py-[50px] md:py-[75px]">
        <Container className="relative z-[5]">
          <Title>Rounds</Title>
          <div className="flex flex-col md:flex-row gap-8 mt-6 md:mt-9">
            {/* {address && (
                            <div className="card w-full bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <TimeSlotSystem address={address} />
                                </div>
                            </div>
                        )} */}

            <RoundInfos />

            <PoolKeyHashDisplay poolKeyHash={poolKeyHash} />
          </div>
        </Container>
        <img
          src="/blue-glare4.png"
          alt="glare"
          className="absolute w-full -bottom-[10%] md:-bottom-[50%] right-0 max-w-[500px] md:max-w-[700px] pointer-events-none"
        />
        <img
          src="/cursor/10.png"
          alt="eppilse"
          className="absolute bottom-[0] md:bottom-[10%] left-[0px] md:left-[20px] max-w-[50px] md:max-w-[80px]"
        />
        <img
          src="/cursor/7.png"
          alt="eppilse"
          className="absolute bottom-[10px] md:bottom-[300px] right-[50px] md:right-0 max-w-[50px] md:max-w-[80px]"
        />
      </section>
    </div>
  );
};

export default V4SwapComponent;
