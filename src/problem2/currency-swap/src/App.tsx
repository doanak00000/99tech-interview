import React, { useState, useCallback, useMemo } from 'react';
import { 
  Container, 
  VStack, 
  Heading, 
  Button, 
  useToast,
  Card,
  CardBody,
  Icon,
  Flex,
  Box,
  Spinner
} from '@chakra-ui/react';
import { FaExchangeAlt } from 'react-icons/fa';
import { useQuery } from 'react-query';
import axios from 'axios';
import debounce from 'lodash/debounce';
import CurrencyInput from './components/CurrencyInput';
import { TokenPrice, SwapFormData } from './utils/types';

const findPrice = (currency: string, prices: TokenPrice[]) => 
  prices?.find(p => p.currency === currency)?.price || 0;

const SwapForm = React.memo(({ formData, onFormChange, onSwap, prices, isLoading }: {
  formData: SwapFormData;
  onFormChange: (data: SwapFormData) => void;
  onSwap: () => void;
  prices: TokenPrice[];
  isLoading: boolean;
}) => (
  <VStack spacing={6} align="center">
    <CurrencyInput
      label="From"
      value={formData.fromAmount}
      currency={formData.fromCurrency}
      onAmountChange={(value) => onFormChange({...formData, fromAmount: value})}
      onCurrencyChange={(value) => onFormChange({...formData, fromCurrency: value})}
      prices={prices}
    />

    <Flex w="full" justify="center" py={4}>
      <Icon 
        as={FaExchangeAlt} 
        w={7} 
        h={7} 
        color="blue.500"
        transform="rotate(90deg)"
        transition="transform 0.3s"
        _hover={{ transform: "rotate(90deg) scale(1.2)" }}
        cursor="pointer"
      />
    </Flex>

    <CurrencyInput
      label="To"
      value={formData.toAmount}
      currency={formData.toCurrency}
      onAmountChange={(value) => onFormChange({...formData, toAmount: value})}
      onCurrencyChange={(value) => onFormChange({...formData, toCurrency: value})}
      prices={prices}
      isReadOnly={true}
    />

    <Button 
      colorScheme="blue"
      size="lg"
      width="full"
      onClick={onSwap}
      bgGradient="linear(to-r, blue.400, purple.500)"
      _hover={{
        bgGradient: "linear(to-r, blue.500, purple.600)",
        transform: "translateY(-2px)",
        boxShadow: "lg"
      }}
      transform="translateY(0)"
      transition="all 0.2s"
      _active={{
        transform: "translateY(2px)",
      }}
      height="56px"
      fontSize="lg"
      fontWeight="bold"
      isLoading={isLoading}
    >
      Swap Now
    </Button>
  </VStack>
));

const App = () => {
  const [formData, setFormData] = useState<SwapFormData>({
    fromCurrency: '',
    toCurrency: '',
    fromAmount: '',
    toAmount: ''
  });

  const toast = useToast();

  const { data: prices, isLoading, error } = useQuery<TokenPrice[]>('prices', async () => {
    const response = await axios.get('https://interview.switcheo.com/prices.json');
    return Object.values(
      response.data.reduce((acc: Record<string, TokenPrice>, curr: TokenPrice) => {
        acc[curr.currency] = curr;
        return acc;
      }, {})
    );
  }, {
    staleTime: 30000,
    cacheTime: 60000,
    retry: 3,
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to fetch prices. Please try again.',
        status: 'error',
        duration: 3000,
      });
    }
  });

  const debouncedSetFormData = useCallback(
    debounce((newFormData: SwapFormData) => {
      const calculatedToAmount = calculateToAmount(newFormData);
      setFormData({ ...newFormData, toAmount: calculatedToAmount || '' });
    }, 300),
    [prices]
  );

  const calculateToAmount = useMemo(() => (formData: SwapFormData) => {
    if (!prices || !formData.fromAmount || !formData.fromCurrency || !formData.toCurrency) return;
    
    const fromPrice = findPrice(formData.fromCurrency, prices);
    const toPrice = findPrice(formData.toCurrency, prices);
    
    if (fromPrice && toPrice) {
      return (parseFloat(formData.fromAmount) * fromPrice / toPrice).toFixed(6);
    }
  }, [prices]);

  const handleSwap = () => {
    if (!formData.fromAmount || !formData.toCurrency || !formData.fromCurrency) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    toast({
      title: 'Success',
      description: 'Swap executed successfully!',
      status: 'success',
      duration: 3000,
    });
  };

  if (error) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Heading color="red.500">Failed to load application</Heading>
      </Box>
    );
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" bg="gray.50" minWidth={'100vw'}>
      <Container maxW="container.sm" py={10}>
        <VStack gap={8} align="center">
          <Heading 
            bgGradient="linear(to-r, blue.400, purple.500)"
            bgClip="text"
            fontSize="4xl"
            fontWeight="extrabold"
            textAlign="center"
          >
            Currency Swap
          </Heading>
          
          <Card 
            width="full" 
            variant="elevated" 
            p={6} 
            boxShadow="2xl"
            bg="white"
            borderRadius="xl"
          >
            <CardBody>
              <SwapForm 
                formData={formData}
                onFormChange={debouncedSetFormData}
                onSwap={handleSwap}
                prices={prices || []}
                isLoading={isLoading}
              />
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default App;
