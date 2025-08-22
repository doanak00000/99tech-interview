import { Box, HStack, Image, Input } from '@chakra-ui/react';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import Select from 'react-select';
import { TokenPrice } from '../utils/types.ts';

interface CurrencyInputProps {
  label: string;
  value: string;
  currency: string;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: string) => void;
  prices: TokenPrice[];
  isReadOnly?: boolean;
}

const CurrencyInput = ({
  label,
  value,
  currency,
  onAmountChange,
  onCurrencyChange,
  prices,
  isReadOnly = false
}: CurrencyInputProps) => {
  const options = prices.map(price => ({
    value: price.currency,
    label: price.currency,
    image: `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${price.currency}.svg`
  }));

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <HStack>
      <Box width="150px">
          <Select
            options={options}
            value={options.find(opt => opt.value === currency)}
            onChange={(option) => onCurrencyChange(option?.value || '')}
            formatOptionLabel={option => (
              <HStack>
                <Image
                  src={option.image}
                  alt={option.label}
                  boxSize="20px"
                  fallbackSrc="https://via.placeholder.com/20"
                />
                <span>{option.label}</span>
              </HStack>
            )}
          />
        </Box>
        <Input
          type="number"
          value={value}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.00"
          flex={1}
          readOnly={isReadOnly}
        />
    
      </HStack>
    </FormControl>
  );
};

export default CurrencyInput;
