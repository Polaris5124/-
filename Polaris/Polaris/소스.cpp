#include<stdio.h>
int main()

{
	float a, b;
	float result;
	char k;
	printf("ù��° ���� �Է����ּ���:");
	scanf_s("%f", &a);
	printf("���� ��ȣ�� �Է����ּ���:");
	scanf_s("%*c%c", &k, 1);
	printf("�ι�° ���� �Է����ּ���:");
	scanf_s("%f", &b);
	if (k == '+')
	{
		result = a + b;
		printf("%f + %f = %f", a, b, result);
	}
	if (k == '-')
	{
		result = a - b;
		printf("%f - %f = %f", a, b, result);
	}
	if (k == '*')
	{
		result = a * b;
		printf("%f * %f = %f", a, b, result);
	}
	if (k == '/') {
		if (b == 0)
		{
			//0���� ������ ���� ����
			printf("0���δ� ���� �� �����ϴ�.");
			return 0;
		}
		else
			result = a / b;
		printf("%f / %f = %f", a, b, result);
	}
	else
		printf("�߸��� �����Դϴ�.");
	return 0;
}