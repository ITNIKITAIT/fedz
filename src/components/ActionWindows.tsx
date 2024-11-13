import Container from './Container';
import Subtitle from './ui/Subtitle';
import Title from './ui/Title';

const ActionWindows = () => {
    return (
        <section className="py-[50px] md:py-[75px] relative">
            <Container>
                <div className="overflow-hidden p-[30px] md:p-[72px] border-[1px] border-white/20 rounded-[32px] bg-[#04152F78] relative">
                    <div className="relative z-[5]">
                        <Subtitle className="mb-1">Status</Subtitle>
                        <Title>Action Windows</Title>
                        <div className="overflow-x-auto mt-10 md:mt-14">
                            <table className="min-w-full text-primary">
                                <thead>
                                    <tr className="text-left text-base md:text-xl font-bold">
                                        <th className="py-4 pr-4">Slot</th>
                                        <th className="pr-4">Start Time</th>
                                        <th className="pr-4">End Time</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-sm md:text-xl text-nowrap">
                                        <td className="py-4 pr-4">1.</td>
                                        <td className="pr-4">
                                            04/11/2024, 03:16:56 PM
                                        </td>
                                        <td className="pr-4">
                                            04/11/2024, 05:16:25 PM
                                        </td>
                                        <td>
                                            <Subtitle>Ended</Subtitle>
                                        </td>
                                    </tr>
                                    <tr className="text-sm md:text-xl text-nowrap">
                                        <td className="py-4 pr-4">2.</td>
                                        <td className="pr-4">
                                            04/11/2024, 01:35:28 PM
                                        </td>
                                        <td className="pr-4">
                                            04/11/2024, 02:25:27 PM
                                        </td>
                                        <td>
                                            <Subtitle>Ended</Subtitle>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <img
                        src="/blue-glare4.png"
                        alt="eppilse"
                        className="absolute -bottom-[130%] right-0 pointer-events-none"
                    />
                    <img
                        src="/blue-glare2.png"
                        alt="eppilse"
                        className="absolute top-0 left-0 pointer-events-none"
                    />
                </div>
            </Container>
            <img
                src="/cursor/10.png"
                alt="eppilse"
                className="absolute top-[0] md:top-[30%] left-[10px] md:left-[10px] max-w-[50px] md:max-w-[100px]"
            />
            <img
                src="/cursor/8.png"
                alt="eppilse"
                className="absolute bottom-[10px] md:bottom-[40px] right-[10px] md:right-[50px] max-w-[40px] md:max-w-[80px]"
            />
        </section>
    );
};

export default ActionWindows;